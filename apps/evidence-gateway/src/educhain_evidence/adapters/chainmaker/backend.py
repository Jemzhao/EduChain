import json
import sqlite3
from datetime import UTC, datetime
from importlib import import_module
from pathlib import Path
from typing import Any, Protocol, cast
from uuid import NAMESPACE_URL, UUID, uuid5

from educhain_evidence.application.errors import (
    EvidenceConfigurationError,
    EvidenceConflictError,
    EvidenceRejectedError,
    EvidenceResultUnknownError,
    EvidenceTimeoutError,
    EvidenceUnavailableError,
)
from educhain_evidence.application.models import (
    BackendHealth,
    EvidencePayload,
    EvidenceProof,
    EvidenceStatus,
    VerificationRequest,
    VerificationResponse,
    VerificationResult,
)
from educhain_evidence.config.settings import Settings
from educhain_evidence.crypto.canonicalization import canonicalize_json
from educhain_evidence.crypto.hashing import sha256_hex


class ChainMakerClient(Protocol):
    def invoke_contract(
        self,
        contract_name: str,
        method: str,
        params: dict[str, str],
        tx_id: str,
        timeout: int,
        with_sync_result: bool,
    ) -> object: ...

    def get_tx_by_tx_id(self, tx_id: str) -> object: ...

    def get_block_height_by_tx_id(self, tx_id: str) -> int: ...

    def get_block_header_by_height(self, block_height: int) -> object: ...

    def get_chainmaker_server_version(self) -> str: ...


class ChainMakerEvidenceBackend:
    """ChainMaker SDK boundary with deterministic transaction and proof identifiers.

    The adapter follows the official Python SDK surface (`ChainClient.invoke_contract`,
    transaction lookup and block lookup). SDK imports and certificate material remain
    isolated in this module so no business service depends on ChainMaker types.
    """

    def __init__(self, settings: Settings, client: ChainMakerClient | None = None) -> None:
        self._settings = settings
        self._client = client or self._build_client(settings)
        self._cache_path = settings.data_path
        self._cache_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_cache()

    @property
    def name(self) -> str:
        return "CHAINMAKER"

    def submit(self, idempotency_key: str, payload: EvidencePayload) -> EvidenceProof:
        payload_json = payload.model_dump_json()
        proof_id = uuid5(NAMESPACE_URL, f"educhain:{idempotency_key}")
        transaction_id = sha256_hex(f"educhain:{idempotency_key}".encode())
        payload_digest = sha256_hex(canonicalize_json(payload.model_dump(mode="json")))
        submitted_at = datetime.now(UTC)

        with self._connect() as connection:
            existing = self._find_by_idempotency_key(connection, idempotency_key)
            if existing is not None:
                if existing[2] != payload_json:
                    raise EvidenceConflictError(
                        "The idempotency key is already bound to another payload."
                    )
                return self._refresh(self._proof_from_row(existing), connection)
            connection.execute(
                """
                INSERT INTO chainmaker_submission (
                    proof_id, idempotency_key, payload_json, payload_digest, status,
                    transaction_id, submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(proof_id),
                    idempotency_key,
                    payload_json,
                    payload_digest,
                    "UNKNOWN",
                    transaction_id,
                    submitted_at.isoformat(),
                ),
            )

        params = {
            "proofId": str(proof_id),
            "payload": canonicalize_json(payload.model_dump(mode="json")).decode(),
            "payloadDigest": payload_digest,
        }
        try:
            response = self._client.invoke_contract(
                self._settings.chainmaker_contract_name,
                self._settings.chainmaker_submit_method,
                params,
                transaction_id,
                self._settings.chainmaker_submit_timeout_seconds,
                False,
            )
            response_code = self._integer_attribute(response, "code")
            if response_code not in {None, 0}:
                self._update_status(proof_id, EvidenceStatus.TERMINATED)
                raise EvidenceRejectedError("ChainMaker rejected the evidence transaction.")
            self._update_status(proof_id, EvidenceStatus.ACCEPTED)
        except EvidenceRejectedError:
            raise
        except Exception as exception:
            mapped = self._map_sdk_error(exception, submission=True)
            raise mapped from exception

        proof = self.get_proof(str(proof_id))
        if proof is None:
            raise EvidenceResultUnknownError("The submitted proof could not be read from cache.")
        return proof

    def get_proof(self, proof_id: str) -> EvidenceProof | None:
        with self._connect() as connection:
            row = connection.execute(
                f"SELECT {self._columns()} FROM chainmaker_submission WHERE proof_id = ?",
                (proof_id,),
            ).fetchone()
            if row is None:
                return None
            return self._refresh(self._proof_from_row(row), connection)

    def get_by_idempotency_key(self, idempotency_key: str) -> EvidenceProof | None:
        with self._connect() as connection:
            row = self._find_by_idempotency_key(connection, idempotency_key)
            if row is None:
                return None
            return self._refresh(self._proof_from_row(row), connection)

    def verify(self, request: VerificationRequest) -> VerificationResponse:
        if request.proof_id is None:
            return VerificationResponse(
                result=VerificationResult.NOT_FOUND,
                checked_digest=request.content_digest,
            )
        proof = self.get_proof(str(request.proof_id))
        if proof is None:
            result = VerificationResult.NOT_FOUND
        elif proof.status not in {EvidenceStatus.CONFIRMED}:
            result = VerificationResult.PENDING
        elif proof.payload.content_digest == request.content_digest:
            result = VerificationResult.MATCHED
        else:
            result = VerificationResult.MISMATCHED
        return VerificationResponse(
            result=result,
            proof=proof,
            checked_digest=request.content_digest,
        )

    def health(self) -> BackendHealth:
        try:
            available = bool(self._client.get_chainmaker_server_version())
        except Exception:
            available = False
        return BackendHealth(
            available=available,
            backend="CHAINMAKER",
            network_id=self._settings.chainmaker_chain_id or "unconfigured",
            capabilities=("submit", "status", "proof", "verify"),
        )

    def _refresh(self, proof: EvidenceProof, connection: sqlite3.Connection) -> EvidenceProof:
        if proof.status in {EvidenceStatus.CONFIRMED, EvidenceStatus.TERMINATED}:
            return proof
        if proof.transaction_id is None:
            return proof
        try:
            self._client.get_tx_by_tx_id(proof.transaction_id)
            height = self._client.get_block_height_by_tx_id(proof.transaction_id)
            header = self._client.get_block_header_by_height(height)
            block_hash = self._hex_attribute(header, "block_hash", "blockHash")
            confirmed_at = self._datetime_attribute(
                header, "block_timestamp", "blockTimestamp", "timestamp"
            ) or datetime.now(UTC)
            connection.execute(
                """
                UPDATE chainmaker_submission
                SET status = ?, block_height = ?, block_hash = ?, confirmed_at = ?
                WHERE proof_id = ?
                """,
                (
                    "CONFIRMED",
                    height,
                    block_hash,
                    confirmed_at.isoformat(),
                    str(proof.proof_id),
                ),
            )
            return proof.model_copy(
                update={
                    "status": EvidenceStatus.CONFIRMED,
                    "block_height": height,
                    "block_hash": block_hash,
                    "confirmed_at": confirmed_at,
                }
            )
        except Exception:
            return proof

    def _initialize_cache(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chainmaker_submission (
                    proof_id TEXT PRIMARY KEY,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    payload_json TEXT NOT NULL,
                    payload_digest TEXT NOT NULL,
                    status TEXT NOT NULL,
                    transaction_id TEXT NOT NULL UNIQUE,
                    block_height INTEGER NULL,
                    block_hash TEXT NULL,
                    submitted_at TEXT NOT NULL,
                    confirmed_at TEXT NULL
                )
                """
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self._cache_path, timeout=5)

    def _find_by_idempotency_key(
        self, connection: sqlite3.Connection, idempotency_key: str
    ) -> tuple[object, ...] | None:
        return cast(
            tuple[object, ...] | None,
            connection.execute(
                f"SELECT {self._columns()} FROM chainmaker_submission WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone(),
        )

    def _proof_from_row(self, row: tuple[object, ...]) -> EvidenceProof:
        (
            proof_id,
            _idempotency_key,
            payload_json,
            payload_digest,
            status,
            transaction_id,
            block_height,
            block_hash,
            submitted_at,
            confirmed_at,
        ) = row
        return EvidenceProof(
            proof_id=UUID(str(proof_id)),
            status=EvidenceStatus(str(status)),
            backend="CHAINMAKER",
            network_id=self._settings.chainmaker_chain_id or "unconfigured",
            transaction_id=str(transaction_id),
            block_height=int(str(block_height)) if block_height is not None else None,
            block_hash=str(block_hash) if block_hash is not None else None,
            submitted_at=datetime.fromisoformat(str(submitted_at)),
            confirmed_at=datetime.fromisoformat(str(confirmed_at)) if confirmed_at else None,
            payload_digest=str(payload_digest),
            payload=EvidencePayload.model_validate(json.loads(str(payload_json))),
        )

    def _update_status(self, proof_id: UUID, status: EvidenceStatus) -> None:
        with self._connect() as connection:
            connection.execute(
                "UPDATE chainmaker_submission SET status = ? WHERE proof_id = ?",
                (status.value, str(proof_id)),
            )

    @staticmethod
    def _build_client(settings: Settings) -> ChainMakerClient:
        try:
            chain_client_type = import_module("chainmaker.chain_client").ChainClient
            user_type = import_module("chainmaker.user").User
            node_type = import_module("chainmaker.node").Node
            file_utils = import_module("chainmaker.utils.file_utils")
            read = file_utils.read_file_bytes
            assert settings.chainmaker_org_id is not None
            assert settings.chainmaker_node_address is not None
            assert settings.chainmaker_tls_host_name is not None
            assert settings.chainmaker_chain_id is not None
            path_values = (
                settings.chainmaker_sign_key_path,
                settings.chainmaker_sign_cert_path,
                settings.chainmaker_tls_key_path,
                settings.chainmaker_tls_cert_path,
            )
            if any(path is None for path in path_values):
                raise EvidenceConfigurationError("ChainMaker certificate paths are incomplete.")
            sign_key, sign_cert, tls_key, tls_cert = cast(
                tuple[Path, Path, Path, Path], path_values
            )
            user = user_type(
                settings.chainmaker_org_id,
                sign_key_bytes=read(str(sign_key)),
                sign_cert_bytes=read(str(sign_cert)),
                tls_key_bytes=read(str(tls_key)),
                tls_cert_bytes=read(str(tls_cert)),
            )
            node = node_type(
                node_addr=settings.chainmaker_node_address,
                conn_cnt=1,
                enable_tls=True,
                trust_cas=[read(str(path)) for path in settings.chainmaker_trust_ca_paths],
                tls_host_name=settings.chainmaker_tls_host_name,
            )
            return cast(
                ChainMakerClient,
                chain_client_type(chain_id=settings.chainmaker_chain_id, user=user, nodes=[node]),
            )
        except EvidenceConfigurationError:
            raise
        except Exception as exception:
            raise EvidenceConfigurationError(
                "The official ChainMaker Python SDK could not be initialized."
            ) from exception

    @staticmethod
    def _map_sdk_error(exception: Exception, submission: bool) -> Exception:
        message = f"{type(exception).__name__} {exception}".lower()
        if "timeout" in message or "deadline" in message:
            if submission:
                return EvidenceResultUnknownError(
                    "ChainMaker submission timed out and its result is unknown."
                )
            return EvidenceTimeoutError("ChainMaker query timed out.")
        if "unavailable" in message or "connection" in message or "grpc" in message:
            return EvidenceUnavailableError("ChainMaker is temporarily unavailable.")
        return EvidenceResultUnknownError("ChainMaker returned an unrecognized response.")

    @staticmethod
    def _integer_attribute(value: object, *names: str) -> int | None:
        for name in names:
            candidate = getattr(value, name, None)
            if candidate is not None:
                try:
                    return int(candidate)
                except (TypeError, ValueError):
                    continue
        return None

    @staticmethod
    def _hex_attribute(value: object, *names: str) -> str | None:
        for name in names:
            candidate: Any = getattr(value, name, None)
            if isinstance(candidate, bytes):
                return candidate.hex()
            if isinstance(candidate, str) and candidate:
                return candidate
        return None

    @staticmethod
    def _datetime_attribute(value: object, *names: str) -> datetime | None:
        for name in names:
            candidate = getattr(value, name, None)
            if candidate is None:
                continue
            try:
                timestamp = int(candidate)
                if timestamp > 10_000_000_000:
                    timestamp //= 1000
                return datetime.fromtimestamp(timestamp, UTC)
            except (TypeError, ValueError, OSError):
                continue
        return None

    @staticmethod
    def _columns() -> str:
        return (
            "proof_id, idempotency_key, payload_json, payload_digest, status, transaction_id, "
            "block_height, block_hash, submitted_at, confirmed_at"
        )

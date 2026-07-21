import json
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal, cast
from uuid import NAMESPACE_URL, UUID, uuid5

from educhain_evidence.application.errors import (
    EvidenceConflictError,
    EvidenceRejectedError,
    EvidenceResultUnknownError,
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
from educhain_evidence.crypto.canonicalization import canonicalize_json
from educhain_evidence.crypto.hashing import sha256_hex

SimulatorScenario = Literal["instant", "delayed", "temporary_failure", "unknown", "terminated"]


class SimulatorEvidenceBackend:
    network_id = "educhain-simulator-v1"

    def __init__(
        self,
        database_path: Path,
        scenario: SimulatorScenario = "instant",
        confirmation_delay_seconds: int = 2,
    ) -> None:
        self._database_path = database_path
        self._scenario = scenario
        self._confirmation_delay = timedelta(seconds=confirmation_delay_seconds)
        self._database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    @property
    def name(self) -> str:
        return "SIMULATOR"

    def submit(self, idempotency_key: str, payload: EvidencePayload) -> EvidenceProof:
        payload_json = payload.model_dump_json()
        deterministic_id = uuid5(NAMESPACE_URL, f"educhain:{idempotency_key}")
        transaction_id = sha256_hex(
            canonicalize_json(
                {
                    "idempotencyKey": idempotency_key,
                    "payload": payload.model_dump(mode="json"),
                }
            )
        )
        payload_digest = sha256_hex(canonicalize_json(payload.model_dump(mode="json")))

        with self._connect() as connection:
            existing = self._find_by_idempotency_key(connection, idempotency_key)
            if existing is not None:
                if existing[2] != payload_json:
                    raise EvidenceConflictError(
                        "The idempotency key is already bound to another payload."
                    )
                return self._proof_from_row(existing, connection)

            attempt = self._record_attempt(connection, idempotency_key)
            if self._scenario == "temporary_failure" and attempt == 1:
                connection.commit()
                raise EvidenceUnavailableError("The simulator injected a temporary failure.")
            if self._scenario == "terminated":
                raise EvidenceRejectedError("The simulator rejected the submission.")

            next_height = connection.execute(
                "SELECT COALESCE(MAX(block_height), 0) + 1 FROM evidence_proof"
            ).fetchone()[0]
            submitted_at = datetime.now(UTC)
            status = (
                "CONFIRMED" if self._scenario in {"instant", "temporary_failure"} else "ACCEPTED"
            )
            confirmed_at = submitted_at if status == "CONFIRMED" else None
            block_hash = sha256_hex(f"{transaction_id}:{next_height}".encode())
            connection.execute(
                """
                INSERT INTO evidence_proof (
                    proof_id, idempotency_key, payload_json, payload_digest,
                    status, transaction_id, block_height, block_hash,
                    submitted_at, confirmed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(deterministic_id),
                    idempotency_key,
                    payload_json,
                    payload_digest,
                    status,
                    transaction_id,
                    next_height,
                    block_hash,
                    submitted_at.isoformat(),
                    confirmed_at.isoformat() if confirmed_at else None,
                ),
            )
            row = self._find_by_idempotency_key(connection, idempotency_key)
            if row is None:
                raise EvidenceUnavailableError("The simulator could not persist the proof.")
            proof = self._proof_from_row(row, connection)
            if self._scenario == "unknown":
                connection.commit()
                raise EvidenceResultUnknownError(
                    "The simulator accepted the proof but hid the submission response."
                )
            return proof

    def get_proof(self, proof_id: str) -> EvidenceProof | None:
        with self._connect() as connection:
            row = connection.execute(
                f"SELECT {self._columns()} FROM evidence_proof WHERE proof_id = ?",
                (proof_id,),
            ).fetchone()
            return None if row is None else self._proof_from_row(row, connection)

    def get_by_idempotency_key(self, idempotency_key: str) -> EvidenceProof | None:
        with self._connect() as connection:
            row = self._find_by_idempotency_key(connection, idempotency_key)
            return None if row is None else self._proof_from_row(row, connection)

    def verify(self, request: VerificationRequest) -> VerificationResponse:
        if request.proof_id is None:
            return VerificationResponse(
                result=VerificationResult.NOT_FOUND,
                checked_digest=request.content_digest,
            )
        proof = self.get_proof(str(request.proof_id))
        if proof is None:
            result = VerificationResult.NOT_FOUND
        elif proof.status != EvidenceStatus.CONFIRMED:
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
            with self._connect() as connection:
                connection.execute("SELECT 1").fetchone()
            available = True
        except sqlite3.Error:
            available = False
        return BackendHealth(
            available=available,
            backend="SIMULATOR",
            network_id=self.network_id,
            capabilities=("submit", "status", "proof", "verify"),
        )

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS evidence_proof (
                    proof_id TEXT PRIMARY KEY,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    payload_json TEXT NOT NULL,
                    payload_digest TEXT NOT NULL,
                    status TEXT NOT NULL,
                    transaction_id TEXT NOT NULL UNIQUE,
                    block_height INTEGER NOT NULL UNIQUE,
                    block_hash TEXT NOT NULL UNIQUE,
                    submitted_at TEXT NOT NULL,
                    confirmed_at TEXT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS simulator_attempt (
                    idempotency_key TEXT PRIMARY KEY,
                    attempt_count INTEGER NOT NULL
                )
                """
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self._database_path, timeout=5)

    def _record_attempt(self, connection: sqlite3.Connection, idempotency_key: str) -> int:
        connection.execute(
            """
            INSERT INTO simulator_attempt (idempotency_key, attempt_count)
            VALUES (?, 1)
            ON CONFLICT(idempotency_key)
            DO UPDATE SET attempt_count = attempt_count + 1
            """,
            (idempotency_key,),
        )
        return int(
            connection.execute(
                "SELECT attempt_count FROM simulator_attempt WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()[0]
        )

    def _find_by_idempotency_key(
        self, connection: sqlite3.Connection, idempotency_key: str
    ) -> sqlite3.Row | tuple[object, ...] | None:
        return cast(
            sqlite3.Row | tuple[object, ...] | None,
            connection.execute(
                f"SELECT {self._columns()} FROM evidence_proof WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone(),
        )

    def _proof_from_row(
        self,
        row: sqlite3.Row | tuple[object, ...],
        connection: sqlite3.Connection,
    ) -> EvidenceProof:
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
        parsed_submitted_at = datetime.fromisoformat(str(submitted_at))
        parsed_confirmed_at = datetime.fromisoformat(str(confirmed_at)) if confirmed_at else None
        if (
            status == "ACCEPTED"
            and self._scenario in {"delayed", "unknown"}
            and datetime.now(UTC) >= parsed_submitted_at + self._confirmation_delay
        ):
            parsed_confirmed_at = datetime.now(UTC)
            status = "CONFIRMED"
            connection.execute(
                "UPDATE evidence_proof SET status = ?, confirmed_at = ? WHERE proof_id = ?",
                (status, parsed_confirmed_at.isoformat(), str(proof_id)),
            )
        return EvidenceProof(
            proof_id=UUID(str(proof_id)),
            status=EvidenceStatus(str(status)),
            backend="SIMULATOR",
            network_id=self.network_id,
            transaction_id=str(transaction_id),
            block_height=int(str(block_height)),
            block_hash=str(block_hash),
            submitted_at=parsed_submitted_at,
            confirmed_at=parsed_confirmed_at,
            payload_digest=str(payload_digest),
            payload=EvidencePayload.model_validate(json.loads(str(payload_json))),
        )

    @staticmethod
    def _columns() -> str:
        return (
            "proof_id, idempotency_key, payload_json, payload_digest, status, transaction_id, "
            "block_height, block_hash, submitted_at, confirmed_at"
        )

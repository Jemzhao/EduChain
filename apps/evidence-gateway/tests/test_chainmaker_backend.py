from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest

from educhain_evidence.adapters.chainmaker.backend import ChainMakerEvidenceBackend
from educhain_evidence.application.errors import (
    EvidenceConflictError,
    EvidenceRejectedError,
    EvidenceResultUnknownError,
)
from educhain_evidence.application.models import EvidencePayload, EvidenceStatus
from educhain_evidence.config.settings import Settings


class FakeChainMakerClient:
    def __init__(self) -> None:
        self.invoke_calls = 0
        self.invoke_error: Exception | None = None
        self.response_code = 0

    def invoke_contract(
        self,
        contract_name: str,
        method: str,
        params: dict[str, str],
        tx_id: str,
        timeout: int,
        with_sync_result: bool,
    ) -> object:
        self.invoke_calls += 1
        if self.invoke_error is not None:
            raise self.invoke_error
        return SimpleNamespace(code=self.response_code)

    def get_tx_by_tx_id(self, tx_id: str) -> object:
        if self.invoke_error is not None:
            raise self.invoke_error
        return SimpleNamespace(tx_id=tx_id)

    def get_block_height_by_tx_id(self, tx_id: str) -> int:
        return 42

    def get_block_header_by_height(self, block_height: int) -> object:
        return SimpleNamespace(block_hash=b"\x01" * 32, block_timestamp=1_782_864_000)

    def get_chainmaker_server_version(self) -> str:
        return "v2.3"


def settings(tmp_path: Path) -> Settings:
    certificate = tmp_path / "identity.pem"
    return Settings(
        internal_service_token="test-service-token-that-is-long-enough",
        mode="chainmaker",
        data_path=tmp_path / "chainmaker-cache.sqlite3",
        chainmaker_chain_id="chain1",
        chainmaker_org_id="wx-org1.chainmaker.org",
        chainmaker_node_address="127.0.0.1:12301",
        chainmaker_tls_host_name="chainmaker.org",
        chainmaker_trust_ca_paths=(certificate,),
        chainmaker_sign_key_path=certificate,
        chainmaker_sign_cert_path=certificate,
        chainmaker_tls_key_path=certificate,
        chainmaker_tls_cert_path=certificate,
    )


def payload(*, digest: str = "a" * 64) -> EvidencePayload:
    return EvidencePayload(
        resource_id=uuid4(),
        version_id=uuid4(),
        author_proof_id="author-proof-0001",
        canonicalization_version="v1",
        payload_version=1,
        content_digest=digest,
        published_at=datetime.now(UTC),
    )


def test_chainmaker_submission_is_confirmed_and_replayed_without_resubmission(
    tmp_path: Path,
) -> None:
    client = FakeChainMakerClient()
    backend = ChainMakerEvidenceBackend(settings(tmp_path), client)
    evidence_payload = payload()

    submitted = backend.submit("resource-version-1001", evidence_payload)
    replayed = backend.submit("resource-version-1001", evidence_payload)

    assert submitted.status is EvidenceStatus.CONFIRMED
    assert submitted.block_height == 42
    assert submitted.block_hash == "01" * 32
    assert replayed == submitted
    assert client.invoke_calls == 1
    assert backend.health().available is True


def test_unknown_chainmaker_result_is_recovered_before_any_retry_submission(
    tmp_path: Path,
) -> None:
    client = FakeChainMakerClient()
    client.invoke_error = TimeoutError("deadline exceeded")
    backend = ChainMakerEvidenceBackend(settings(tmp_path), client)
    evidence_payload = payload()

    with pytest.raises(EvidenceResultUnknownError):
        backend.submit("resource-version-1002", evidence_payload)

    client.invoke_error = None
    recovered = backend.submit("resource-version-1002", evidence_payload)

    assert recovered.status is EvidenceStatus.CONFIRMED
    assert client.invoke_calls == 1


def test_chainmaker_rejection_and_idempotency_conflict_are_terminal(tmp_path: Path) -> None:
    client = FakeChainMakerClient()
    client.response_code = 1
    backend = ChainMakerEvidenceBackend(settings(tmp_path), client)
    original = payload()

    with pytest.raises(EvidenceRejectedError):
        backend.submit("resource-version-1003", original)

    stored = backend.get_by_idempotency_key("resource-version-1003")
    assert stored is not None
    assert stored.status is EvidenceStatus.TERMINATED

    with pytest.raises(EvidenceConflictError):
        backend.submit("resource-version-1003", payload(digest="b" * 64))

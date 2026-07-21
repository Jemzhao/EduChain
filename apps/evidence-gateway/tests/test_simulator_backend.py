from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest

from educhain_evidence.adapters.simulator.backend import SimulatorEvidenceBackend
from educhain_evidence.application.errors import (
    EvidenceConflictError,
    EvidenceResultUnknownError,
    EvidenceUnavailableError,
)
from educhain_evidence.application.models import (
    EvidencePayload,
    EvidenceStatus,
    VerificationRequest,
    VerificationResult,
)


def payload(*, digest: str = "a" * 64) -> EvidencePayload:
    return EvidencePayload(
        resource_id=uuid4(),
        version_id=uuid4(),
        author_proof_id="author-proof-0001",
        canonicalization_version="v1",
        payload_version=1,
        content_digest=digest,
        attachment_merkle_root=None,
        published_at=datetime.now(UTC),
    )


def test_instant_submission_is_confirmed_idempotent_and_verifiable(tmp_path: Path) -> None:
    backend = SimulatorEvidenceBackend(tmp_path / "evidence.sqlite3")
    evidence_payload = payload()

    first = backend.submit("resource-version-0001", evidence_payload)
    replay = backend.submit("resource-version-0001", evidence_payload)

    assert first == replay
    assert first.status is EvidenceStatus.CONFIRMED
    assert first.confirmed_at is not None
    assert first.block_height == 1
    assert backend.health().available is True

    matched = backend.verify(
        VerificationRequest(proof_id=first.proof_id, content_digest=evidence_payload.content_digest)
    )
    mismatched = backend.verify(
        VerificationRequest(proof_id=first.proof_id, content_digest="b" * 64)
    )
    missing = backend.verify(VerificationRequest(content_digest=evidence_payload.content_digest))

    assert matched.result is VerificationResult.MATCHED
    assert mismatched.result is VerificationResult.MISMATCHED
    assert missing.result is VerificationResult.NOT_FOUND


def test_idempotency_key_cannot_be_reused_for_a_different_payload(tmp_path: Path) -> None:
    backend = SimulatorEvidenceBackend(tmp_path / "evidence.sqlite3")
    backend.submit("resource-version-0002", payload(digest="a" * 64))

    with pytest.raises(EvidenceConflictError):
        backend.submit("resource-version-0002", payload(digest="b" * 64))


def test_delayed_submission_moves_from_pending_to_confirmed(tmp_path: Path) -> None:
    backend = SimulatorEvidenceBackend(
        tmp_path / "evidence.sqlite3", scenario="delayed", confirmation_delay_seconds=0
    )

    proof = backend.submit("resource-version-0003", payload())
    refreshed = backend.get_proof(str(proof.proof_id))

    assert proof.status is EvidenceStatus.CONFIRMED
    assert refreshed is not None
    assert refreshed.status is EvidenceStatus.CONFIRMED


def test_unknown_submission_can_be_recovered_by_idempotency_key(tmp_path: Path) -> None:
    backend = SimulatorEvidenceBackend(
        tmp_path / "evidence.sqlite3", scenario="unknown", confirmation_delay_seconds=0
    )

    with pytest.raises(EvidenceResultUnknownError):
        backend.submit("resource-version-0004", payload())

    recovered = backend.get_by_idempotency_key("resource-version-0004")
    assert recovered is not None
    assert recovered.status is EvidenceStatus.CONFIRMED


def test_temporary_failure_succeeds_on_retry(tmp_path: Path) -> None:
    backend = SimulatorEvidenceBackend(tmp_path / "evidence.sqlite3", scenario="temporary_failure")
    evidence_payload = payload()

    with pytest.raises(EvidenceUnavailableError):
        backend.submit("resource-version-0005", evidence_payload)

    retried = backend.submit("resource-version-0005", evidence_payload)
    assert retried.status is EvidenceStatus.CONFIRMED

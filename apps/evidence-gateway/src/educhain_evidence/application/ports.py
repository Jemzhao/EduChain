from typing import Protocol

from educhain_evidence.application.models import (
    BackendHealth,
    EvidencePayload,
    EvidenceProof,
    VerificationRequest,
    VerificationResponse,
)


class EvidenceBackend(Protocol):
    @property
    def name(self) -> str: ...

    def submit(self, idempotency_key: str, payload: EvidencePayload) -> EvidenceProof: ...

    def get_proof(self, proof_id: str) -> EvidenceProof | None: ...

    def get_by_idempotency_key(self, idempotency_key: str) -> EvidenceProof | None: ...

    def verify(self, request: VerificationRequest) -> VerificationResponse: ...

    def health(self) -> BackendHealth: ...

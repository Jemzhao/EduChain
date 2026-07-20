from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Digest = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
BackendName = Literal["SIMULATOR", "CHAINMAKER"]


class EvidenceStatus(StrEnum):
    ACCEPTED = "ACCEPTED"
    UNKNOWN = "UNKNOWN"
    CONFIRMED = "CONFIRMED"
    TERMINATED = "TERMINATED"


class VerificationResult(StrEnum):
    MATCHED = "MATCHED"
    MISMATCHED = "MISMATCHED"
    NOT_FOUND = "NOT_FOUND"
    PENDING = "PENDING"
    UNAVAILABLE = "UNAVAILABLE"
    INVALID_INPUT = "INVALID_INPUT"


class EvidencePayload(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    resource_id: UUID
    version_id: UUID
    author_proof_id: Annotated[str, StringConstraints(min_length=16, max_length=128)]
    canonicalization_version: Annotated[str, StringConstraints(min_length=1, max_length=32)]
    payload_version: Annotated[int, Field(ge=1, le=32767)]
    content_digest: Digest
    attachment_merkle_root: Digest | None = None
    published_at: datetime


class EvidenceProof(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    proof_id: UUID
    status: EvidenceStatus
    backend: BackendName
    network_id: Annotated[str, StringConstraints(min_length=1, max_length=120)]
    transaction_id: str | None = None
    block_height: int | None = None
    block_hash: str | None = None
    submitted_at: datetime
    confirmed_at: datetime | None = None
    payload_digest: Digest
    payload: EvidencePayload


class VerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    proof_id: UUID | None = None
    content_digest: Digest


class VerificationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    result: VerificationResult
    proof: EvidenceProof | None = None
    checked_digest: Digest


class CertificateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    resource_title: Annotated[str, StringConstraints(min_length=1, max_length=160)]
    version_number: Annotated[int, Field(ge=1)]
    author_display_name: Annotated[str, StringConstraints(min_length=1, max_length=80)]


class CertificateArtifact(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    proof_id: UUID
    object_key: str
    media_type: Literal["application/pdf"] = "application/pdf"
    size_bytes: int
    sha256: Digest
    template_version: str
    generated_at: datetime


class BackendHealth(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    available: bool
    backend: BackendName
    network_id: str
    capabilities: tuple[str, ...]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    status: Literal["available"] = "available"
    service: Literal["educhain-evidence-gateway"] = "educhain-evidence-gateway"
    mode: Literal["simulator", "chainmaker"]
    backend: BackendHealth

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status

from educhain_evidence.adapters.certificate.generator import CertificateGenerator
from educhain_evidence.api.dependencies import (
    get_certificate_generator,
    get_evidence_backend,
    require_service_identity,
)
from educhain_evidence.application.models import (
    CertificateArtifact,
    CertificateRequest,
    EvidencePayload,
    EvidenceProof,
    VerificationRequest,
    VerificationResponse,
)
from educhain_evidence.application.ports import EvidenceBackend

router = APIRouter(tags=["Evidence"])


@router.post("/evidence", response_model=EvidenceProof, status_code=status.HTTP_202_ACCEPTED)
def submit_evidence(
    payload: EvidencePayload,
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
    _identity: Annotated[None, Depends(require_service_identity)],
    _request_id: Annotated[str, Header(alias="X-Request-Id", min_length=8, max_length=128)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=16, max_length=128)],
    payload_version: Annotated[int, Header(alias="X-Payload-Version", ge=1, le=32767)],
) -> EvidenceProof:
    if payload_version != payload.payload_version:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The payload version header does not match the request body.",
        )
    return backend.submit(idempotency_key=idempotency_key, payload=payload)


@router.get("/evidence/submissions/{idempotency_key}", response_model=EvidenceProof)
def get_submission(
    idempotency_key: str,
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
    _identity: Annotated[None, Depends(require_service_identity)],
) -> EvidenceProof:
    proof = backend.get_by_idempotency_key(idempotency_key)
    if proof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The evidence submission was not found.",
        )
    return proof


@router.get("/evidence/{proof_id}", response_model=EvidenceProof)
def get_evidence(
    proof_id: str,
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
) -> EvidenceProof:
    proof = backend.get_proof(proof_id)
    if proof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The evidence proof was not found.",
        )
    return proof


@router.post("/evidence/{proof_id}/certificate", response_model=CertificateArtifact)
def generate_certificate(
    proof_id: str,
    request: CertificateRequest,
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
    generator: Annotated[CertificateGenerator, Depends(get_certificate_generator)],
    _identity: Annotated[None, Depends(require_service_identity)],
    _request_id: Annotated[str, Header(alias="X-Request-Id", min_length=8, max_length=128)],
    payload_version: Annotated[int, Header(alias="X-Payload-Version", ge=1, le=32767)],
) -> CertificateArtifact:
    if payload_version != 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The certificate payload version is unsupported.",
        )
    proof = backend.get_proof(proof_id)
    if proof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The evidence proof was not found.",
        )
    if proof.status.value != "CONFIRMED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The evidence proof is not confirmed yet.",
        )
    return generator.generate(proof, request)


@router.get("/evidence/{proof_id}/certificate", response_class=Response)
def read_certificate(
    proof_id: str,
    generator: Annotated[CertificateGenerator, Depends(get_certificate_generator)],
    _identity: Annotated[None, Depends(require_service_identity)],
) -> Response:
    content = generator.read(proof_id)
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The evidence certificate was not found.",
        )
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="educhain-{proof_id}.pdf"',
            "Cache-Control": "private, max-age=300",
        },
    )


@router.post("/verifications", response_model=VerificationResponse)
def verify_evidence(
    request: VerificationRequest,
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
    _identity: Annotated[None, Depends(require_service_identity)],
    _request_id: Annotated[str, Header(alias="X-Request-Id", min_length=8, max_length=128)],
    payload_version: Annotated[int, Header(alias="X-Payload-Version", ge=1, le=32767)],
) -> VerificationResponse:
    if payload_version != 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The verification payload version is unsupported.",
        )
    return backend.verify(request)

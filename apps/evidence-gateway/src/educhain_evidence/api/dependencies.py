from hmac import compare_digest
from typing import Annotated, cast

from fastapi import Depends, Header, HTTPException, Request, status

from educhain_evidence.adapters.certificate.generator import CertificateGenerator
from educhain_evidence.application.ports import EvidenceBackend
from educhain_evidence.config.settings import Settings, get_settings


def get_evidence_backend(request: Request) -> EvidenceBackend:
    return cast(EvidenceBackend, request.app.state.evidence_backend)


def get_certificate_generator(request: Request) -> CertificateGenerator:
    return cast(CertificateGenerator, request.app.state.certificate_generator)


def require_service_identity(
    settings: Annotated[Settings, Depends(get_settings)],
    token: Annotated[str | None, Header(alias="X-Service-Token")] = None,
) -> None:
    if token is None or not compare_digest(token, settings.internal_service_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid internal service identity is required.",
        )

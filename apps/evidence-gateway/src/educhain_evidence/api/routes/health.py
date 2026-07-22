from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse

from educhain_evidence.api.dependencies import get_evidence_backend, require_service_identity
from educhain_evidence.application.models import HealthResponse
from educhain_evidence.application.ports import EvidenceBackend
from educhain_evidence.config.settings import Settings, get_settings
from educhain_evidence.observability import operational_metrics

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse)
def get_health(
    backend: Annotated[EvidenceBackend, Depends(get_evidence_backend)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> HealthResponse:
    backend_health = backend.health()
    if not backend_health.available:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return HealthResponse(mode=settings.mode, backend=backend_health)


@router.get(
    "/metrics",
    response_class=PlainTextResponse,
    dependencies=[Depends(require_service_identity)],
    include_in_schema=False,
)
def get_metrics() -> str:
    return operational_metrics.render()

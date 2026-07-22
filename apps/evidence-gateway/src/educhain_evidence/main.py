from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from educhain_evidence.adapters.certificate.generator import CertificateGenerator
from educhain_evidence.adapters.chainmaker.backend import ChainMakerEvidenceBackend
from educhain_evidence.adapters.simulator.backend import SimulatorEvidenceBackend
from educhain_evidence.api.problems import http_problem_handler
from educhain_evidence.api.request_id import RequestIdMiddleware
from educhain_evidence.api.routes import evidence, health
from educhain_evidence.application.errors import EvidenceBackendError
from educhain_evidence.application.ports import EvidenceBackend
from educhain_evidence.config.settings import get_settings
from educhain_evidence.observability import configure_logging


def build_backend() -> EvidenceBackend:
    settings = get_settings()
    if settings.mode == "chainmaker":
        return ChainMakerEvidenceBackend(settings)
    return SimulatorEvidenceBackend(
        settings.data_path,
        scenario=settings.simulator_scenario,
        confirmation_delay_seconds=settings.simulator_confirmation_delay_seconds,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.evidence_backend = build_backend()
    app.state.certificate_generator = CertificateGenerator(
        settings.certificate_storage_path,
        settings.public_base_url,
        settings.certificate_font_path,
    )
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="EduChain Evidence Gateway",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(RequestIdMiddleware)
    app.add_exception_handler(HTTPException, http_problem_handler)
    app.add_exception_handler(RequestValidationError, http_problem_handler)
    app.add_exception_handler(EvidenceBackendError, http_problem_handler)
    app.add_exception_handler(Exception, http_problem_handler)
    app.include_router(health.router)
    app.include_router(evidence.router)
    return app


app = create_app()

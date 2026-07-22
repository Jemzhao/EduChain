import logging
from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from re import compile as compile_pattern
from time import monotonic
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from educhain_evidence.config.settings import get_settings
from educhain_evidence.observability import operational_metrics

request_id_context: ContextVar[str] = ContextVar("request_id", default="unavailable")
safe_request_id = compile_pattern(r"^[A-Za-z0-9._:-]{8,128}$")
logger = logging.getLogger("educhain_evidence.http")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        candidate = request.headers.get("X-Request-Id")
        request_id = (
            candidate if candidate and safe_request_id.fullmatch(candidate) else str(uuid4())
        )
        token = request_id_context.set(request_id)
        started = monotonic()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-Id"] = request_id
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
            )
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
            response.headers["Referrer-Policy"] = "no-referrer"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            return response
        finally:
            duration = monotonic() - started
            route_object = request.scope.get("route")
            route = getattr(route_object, "path", "unmatched")
            operational_metrics.observe(request.method, route, status_code, duration)
            settings = get_settings()
            logger.info(
                "request_completed",
                extra={
                    "service": "educhain-evidence-gateway",
                    "environment": settings.deployment_environment,
                    "version": settings.service_version,
                    "request_id": request_id,
                    "method": request.method,
                    "route": route,
                    "status_code": status_code,
                    "duration_ms": round(duration * 1000, 3),
                },
            )
            request_id_context.reset(token)

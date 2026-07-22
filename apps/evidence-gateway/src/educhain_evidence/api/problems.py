import logging
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from educhain_evidence.api.request_id import request_id_context
from educhain_evidence.application.errors import EvidenceBackendError

logger = logging.getLogger("educhain_evidence.validation")


async def http_problem_handler(request: Request, exception: Exception) -> JSONResponse:
    if isinstance(exception, EvidenceBackendError):
        status_code = exception.status_code
        detail = str(exception)
        field_errors = []
        code = exception.code
        retryable = exception.retryable
    elif isinstance(exception, RequestValidationError):
        status_code = 422
        detail = "One or more request fields are invalid."
        field_errors = [
            {
                "field": ".".join(str(segment) for segment in error["loc"] if segment != "body"),
                "reason": error["type"],
            }
            for error in exception.errors()
        ]
        code = "FIELD_VALIDATION_FAILED"
        retryable = False
        logger.warning(
            "request_validation_failed",
            extra={"field_errors": field_errors},
        )
    elif isinstance(exception, HTTPException):
        status_code = exception.status_code
        detail = str(exception.detail)
        field_errors = []
        code = {
            401: "INTERNAL_AUTHENTICATION_REQUIRED",
            404: "EVIDENCE_NOT_FOUND",
            409: "IDEMPOTENCY_CONFLICT",
            422: "FIELD_VALIDATION_FAILED",
            503: "SERVICE_UNAVAILABLE",
        }.get(status_code, "REQUEST_INVALID")
        retryable = status_code >= 500
    else:
        status_code = 500
        detail = "The request could not be completed."
        field_errors = []
        code = "UNEXPECTED_ERROR"
        retryable = True
        logger.exception("unexpected_request_failure", exc_info=exception)
    body: dict[str, Any] = {
        "type": f"/problems/{code.lower().replace('_', '-')}",
        "title": "Request could not be completed",
        "status": status_code,
        "code": code,
        "detail": detail,
        "instance": request.url.path,
        "requestId": request_id_context.get(),
        "retryable": retryable,
        "parameters": {},
        "fieldErrors": field_errors,
    }
    return JSONResponse(
        body,
        status_code=status_code,
        media_type="application/problem+json",
    )

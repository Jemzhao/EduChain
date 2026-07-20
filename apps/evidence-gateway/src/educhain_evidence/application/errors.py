class EvidenceBackendError(RuntimeError):
    code = "EVIDENCE_BACKEND_FAILURE"
    status_code = 502
    retryable = False


class EvidenceConflictError(EvidenceBackendError):
    code = "IDEMPOTENCY_CONFLICT"
    status_code = 409


class EvidenceRejectedError(EvidenceBackendError):
    code = "EVIDENCE_SUBMISSION_REJECTED"
    status_code = 422


class EvidenceUnavailableError(EvidenceBackendError):
    code = "EVIDENCE_BACKEND_UNAVAILABLE"
    status_code = 503
    retryable = True


class EvidenceTimeoutError(EvidenceBackendError):
    code = "EVIDENCE_BACKEND_TIMEOUT"
    status_code = 504
    retryable = True


class EvidenceResultUnknownError(EvidenceBackendError):
    code = "EVIDENCE_RESULT_UNKNOWN"
    status_code = 503
    retryable = True


class EvidenceConfigurationError(EvidenceBackendError):
    code = "EVIDENCE_CONFIGURATION_INVALID"
    status_code = 503

package com.educhain.evidence.domain;

public enum EvidenceJobStatus {
    PENDING,
    SUBMITTING,
    ACCEPTED,
    UNKNOWN,
    CONFIRMING,
    RETRY_WAIT,
    CONFIRMED,
    CERTIFICATE_PENDING,
    COMPLETED,
    CERTIFICATE_FAILED,
    TERMINATED
}

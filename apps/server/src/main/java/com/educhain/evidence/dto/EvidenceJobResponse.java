package com.educhain.evidence.dto;

import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.domain.EvidenceJobStatus;
import java.time.Instant;
import java.util.UUID;

public record EvidenceJobResponse(
        UUID id,
        UUID resourceId,
        UUID versionId,
        EvidenceBackendType backend,
        EvidenceJobStatus status,
        int attemptCount,
        boolean retryable,
        String errorCode,
        Instant nextAttemptAt,
        Instant createdAt,
        Instant updatedAt
) {
}

package com.educhain.evidence.dto;

import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.domain.EvidenceJobStatus;
import java.util.UUID;

public record ResourceEvidenceResponse(
        UUID resourceId,
        UUID jobId,
        EvidenceJobStatus status,
        EvidenceBackendType backend,
        PublicEvidenceResponse proof,
        boolean retryable,
        String errorCode
) {
}

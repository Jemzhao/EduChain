package com.educhain.evidence.dto;

import com.educhain.evidence.domain.VerificationMethod;
import com.educhain.evidence.domain.VerificationResult;
import java.time.Instant;
import java.util.UUID;

public record VerificationResponse(
        UUID id,
        VerificationResult result,
        VerificationMethod method,
        String checkedDigest,
        PublicEvidenceResponse proof,
        Instant checkedAt
) {
}

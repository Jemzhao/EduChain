package com.educhain.evidence.dto;

import com.educhain.evidence.domain.VerificationMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateVerificationRequest(
        UUID proofId,
        @Size(min = 16, max = 160)
        @Pattern(regexp = "^[A-Za-z0-9._:-]{16,160}$") String transactionId,
        @NotNull VerificationMethod method,
        @NotNull @Pattern(regexp = "^[a-f0-9]{64}$") String contentDigest,
        @Size(max = 255) String originalFileName
) {
}

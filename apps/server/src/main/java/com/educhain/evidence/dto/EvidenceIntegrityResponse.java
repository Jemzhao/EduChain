package com.educhain.evidence.dto;

import java.time.Instant;

public record EvidenceIntegrityResponse(
        EvidenceIntegrityStatus status,
        long totalJobs,
        long totalRecords,
        long orphanRecords,
        long mismatchedRecords,
        Instant checkedAt
) {
}

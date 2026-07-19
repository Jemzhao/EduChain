package com.educhain.evidence.dto;

import com.educhain.evidence.domain.EvidenceBackendType;
import java.time.Instant;
import java.util.UUID;

public record LedgerTransactionResponse(
        String transactionId,
        EvidenceBackendType backend,
        String networkId,
        Long blockHeight,
        String blockHash,
        UUID proofId,
        UUID resourceId,
        UUID versionId,
        String contentDigest,
        Instant submittedAt,
        Instant confirmedAt
) {
}

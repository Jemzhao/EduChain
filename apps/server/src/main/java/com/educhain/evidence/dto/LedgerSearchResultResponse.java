package com.educhain.evidence.dto;

import com.educhain.evidence.domain.EvidenceBackendType;
import java.time.Instant;
import java.util.UUID;

public record LedgerSearchResultResponse(
        SearchKind kind,
        UUID proofId,
        String transactionId,
        EvidenceBackendType backend,
        String networkId,
        Long blockHeight,
        String contentDigest,
        Instant confirmedAt
) {
    public enum SearchKind {
        PROOF,
        TRANSACTION,
        BLOCK,
        DIGEST
    }
}

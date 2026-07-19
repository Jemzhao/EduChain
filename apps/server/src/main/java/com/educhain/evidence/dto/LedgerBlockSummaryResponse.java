package com.educhain.evidence.dto;

import com.educhain.evidence.domain.EvidenceBackendType;
import java.time.Instant;

public record LedgerBlockSummaryResponse(
        EvidenceBackendType backend,
        String networkId,
        long blockHeight,
        String blockHash,
        long transactionCount,
        Instant confirmedAt
) {
}

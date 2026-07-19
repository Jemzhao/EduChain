package com.educhain.evidence.dto;

import java.util.List;

public record LedgerBlockResponse(
        LedgerBlockSummaryResponse block,
        List<LedgerTransactionResponse> transactions,
        String scope
) {
    public LedgerBlockResponse {
        transactions = List.copyOf(transactions);
    }
}

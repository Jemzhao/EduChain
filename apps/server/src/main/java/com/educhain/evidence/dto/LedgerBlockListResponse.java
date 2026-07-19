package com.educhain.evidence.dto;

import java.util.List;

public record LedgerBlockListResponse(
        List<LedgerBlockSummaryResponse> items,
        String scope
) {
    public LedgerBlockListResponse {
        items = List.copyOf(items);
    }
}

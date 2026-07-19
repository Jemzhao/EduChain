package com.educhain.evidence.dto;

import java.util.List;

public record LedgerSearchResponse(
        List<LedgerSearchResultResponse> items,
        String scope
) {
}

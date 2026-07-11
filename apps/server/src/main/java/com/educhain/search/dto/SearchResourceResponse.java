package com.educhain.search.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import java.util.List;
import java.util.UUID;

public record SearchResourceResponse(
        UUID queryId,
        String normalizedQuery,
        List<SearchResourceItemResponse> items,
        PageInfoResponse page
) {
    public SearchResourceResponse {
        items = List.copyOf(items);
    }
}

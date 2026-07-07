package com.educhain.knowledge.dto;

import java.util.List;
import java.util.UUID;

public record ResourceVersionListResponse(
        UUID resourceId,
        List<ResourceVersionSummaryResponse> items
) {
    public ResourceVersionListResponse {
        items = List.copyOf(items);
    }
}

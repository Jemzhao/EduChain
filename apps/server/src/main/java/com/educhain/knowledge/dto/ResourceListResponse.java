package com.educhain.knowledge.dto;

import java.util.List;

public record ResourceListResponse(List<ResourceCardResponse> items, PageInfoResponse page) {
    public ResourceListResponse {
        items = List.copyOf(items);
    }
}

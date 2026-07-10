package com.educhain.taxonomy.dto;

import java.util.List;

public record TagListResponse(List<TagResponse> items) {
    public TagListResponse {
        items = List.copyOf(items);
    }
}

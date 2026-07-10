package com.educhain.taxonomy.dto;

import java.util.List;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String slug,
        String nameKey,
        String descriptionKey,
        int order,
        List<CategoryResponse> children
) {
    public CategoryResponse {
        children = List.copyOf(children);
    }
}

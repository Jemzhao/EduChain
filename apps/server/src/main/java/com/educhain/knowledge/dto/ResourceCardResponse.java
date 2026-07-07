package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.ResourceType;
import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.taxonomy.dto.CategoryResponse;
import com.educhain.taxonomy.dto.TagResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResourceCardResponse(
        UUID id,
        String slug,
        String title,
        String summary,
        ResourceType resourceType,
        ResourceAuthorResponse author,
        CategoryResponse category,
        List<TagResponse> tags,
        Instant publishedAt,
        int readingMinutes,
        EvidenceProcessingStatus evidenceStatus
) {
    public ResourceCardResponse {
        tags = List.copyOf(tags);
    }
}

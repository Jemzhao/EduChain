package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.domain.ResourceType;
import java.time.Instant;
import java.util.UUID;

public record MyResourceSummaryResponse(
        UUID resourceId,
        String slug,
        ResourceStatus status,
        ResourceType resourceType,
        String title,
        String summary,
        long draftVersion,
        Instant savedAt,
        Instant publishedAt,
        Integer publicVersionNumber
) {
}

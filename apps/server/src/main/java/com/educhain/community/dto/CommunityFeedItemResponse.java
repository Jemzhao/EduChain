package com.educhain.community.dto;

import com.educhain.knowledge.dto.ResourceCardResponse;
import java.time.Instant;
import java.util.UUID;

public record CommunityFeedItemResponse(
        UUID id,
        CommunityFeedType type,
        ResourceCardResponse resource,
        Instant createdAt
) {
}

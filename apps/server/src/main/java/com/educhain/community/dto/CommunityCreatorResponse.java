package com.educhain.community.dto;

import com.educhain.knowledge.dto.ResourceAuthorResponse;

public record CommunityCreatorResponse(
        ResourceAuthorResponse author,
        long resourceCount,
        long engagementScore
) {
}

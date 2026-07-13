package com.educhain.interaction.service;

import com.educhain.interaction.domain.CommentStatus;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import java.time.Instant;
import java.util.UUID;

public record GovernanceCommentView(
        UUID id,
        UUID resourceId,
        String resourceTitle,
        ResourceAuthorResponse author,
        String body,
        CommentStatus status,
        long version,
        Instant createdAt
) {
}

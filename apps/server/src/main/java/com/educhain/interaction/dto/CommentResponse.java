package com.educhain.interaction.dto;

import com.educhain.interaction.domain.CommentStatus;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID resourceId,
        UUID parentCommentId,
        UUID rootCommentId,
        ResourceAuthorResponse author,
        String body,
        CommentStatus status,
        int replyCount,
        boolean canDelete,
        Instant createdAt,
        Instant updatedAt
) {
}

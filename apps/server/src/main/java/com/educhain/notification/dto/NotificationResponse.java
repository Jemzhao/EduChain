package com.educhain.notification.dto;

import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.notification.domain.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        ResourceAuthorResponse actor,
        UUID resourceId,
        String resourceSlug,
        String resourceTitle,
        UUID commentId,
        String systemTitle,
        String systemBody,
        boolean read,
        Instant createdAt
) {
}

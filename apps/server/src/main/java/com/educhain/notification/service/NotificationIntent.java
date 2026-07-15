package com.educhain.notification.service;

import com.educhain.notification.domain.NotificationType;
import java.util.UUID;

public record NotificationIntent(
        UUID recipientId,
        NotificationType type,
        String deduplicationKey,
        UUID actorId,
        UUID resourceId,
        UUID commentId
) {
}

package com.educhain.notification.dto;

import com.educhain.notification.domain.NotificationType;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferenceItemRequest(
        @NotNull NotificationType type,
        boolean inAppEnabled,
        boolean externalEnabled
) {
}

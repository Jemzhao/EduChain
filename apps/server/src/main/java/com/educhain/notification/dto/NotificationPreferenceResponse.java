package com.educhain.notification.dto;

import com.educhain.notification.domain.NotificationType;

public record NotificationPreferenceResponse(
        NotificationType type,
        boolean inAppEnabled,
        boolean externalEnabled
) {
}

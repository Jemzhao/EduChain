package com.educhain.notification.entity;

import com.educhain.notification.domain.NotificationType;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class NotificationPreferenceKey implements Serializable {
    private UUID userId;
    private NotificationType type;

    public NotificationPreferenceKey() {
    }

    public NotificationPreferenceKey(UUID userId, NotificationType type) {
        this.userId = userId;
        this.type = type;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof NotificationPreferenceKey that)) return false;
        return Objects.equals(userId, that.userId) && type == that.type;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, type);
    }
}

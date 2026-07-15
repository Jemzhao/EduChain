package com.educhain.notification.entity;

import com.educhain.notification.domain.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@IdClass(NotificationPreferenceKey.class)
@Table(name = "notification_preference")
public class NotificationPreferenceEntity {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, updatable = false, length = 32)
    private NotificationType type;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled;

    @Column(name = "external_enabled", nullable = false)
    private boolean externalEnabled;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected NotificationPreferenceEntity() {
    }

    public NotificationPreferenceEntity(UUID userId, NotificationType type) {
        this.userId = userId;
        this.type = type;
        this.inAppEnabled = true;
        this.externalEnabled = false;
    }

    public NotificationType getType() {
        return type;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public boolean isExternalEnabled() {
        return externalEnabled;
    }

    public void update(boolean inAppEnabled, boolean externalEnabled) {
        this.inAppEnabled = inAppEnabled;
        this.externalEnabled = externalEnabled;
    }
}

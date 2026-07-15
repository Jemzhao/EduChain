package com.educhain.notification.entity;

import com.educhain.notification.domain.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notification")
public class NotificationEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "recipient_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, updatable = false, length = 32)
    private NotificationType type;

    @Column(name = "deduplication_key", nullable = false, updatable = false, length = 160)
    private String deduplicationKey;

    @Column(name = "actor_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID actorId;

    @Column(name = "resource_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "comment_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID commentId;

    @Column(name = "system_title", updatable = false, length = 120)
    private String systemTitle;

    @Column(name = "system_body", updatable = false, length = 1000)
    private String systemBody;

    @Column(name = "read_at")
    private Instant readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected NotificationEntity() {
    }

    public NotificationEntity(
            UUID id,
            UUID recipientId,
            NotificationType type,
            String deduplicationKey,
            UUID actorId,
            UUID resourceId,
            UUID commentId
    ) {
        this.id = id;
        this.recipientId = recipientId;
        this.type = type;
        this.deduplicationKey = deduplicationKey;
        this.actorId = actorId;
        this.resourceId = resourceId;
        this.commentId = commentId;
    }

    public NotificationEntity(
            UUID recipientId,
            String deduplicationKey,
            String systemTitle,
            String systemBody
    ) {
        this.id = UUID.randomUUID();
        this.recipientId = recipientId;
        this.type = NotificationType.SYSTEM_ANNOUNCEMENT;
        this.deduplicationKey = deduplicationKey;
        this.systemTitle = systemTitle;
        this.systemBody = systemBody;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRecipientId() {
        return recipientId;
    }

    public NotificationType getType() {
        return type;
    }

    public UUID getActorId() {
        return actorId;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public UUID getCommentId() {
        return commentId;
    }

    public String getSystemTitle() { return systemTitle; }
    public String getSystemBody() { return systemBody; }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setRead(boolean read, Instant now) {
        readAt = read ? (readAt == null ? now : readAt) : null;
    }
}

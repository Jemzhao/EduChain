package com.educhain.activity.entity;

import com.educhain.activity.domain.ActivityType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_activity_event")
public class UserActivityEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, updatable = false, length = 40)
    private ActivityType type;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserActivityEntity() {
    }

    public UserActivityEntity(UUID userId, ActivityType type, UUID resourceId, Instant createdAt) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.type = type;
        this.resourceId = resourceId;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public ActivityType getType() {
        return type;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

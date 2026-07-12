package com.educhain.discovery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resource_view")
public class ResourceViewEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "viewer_key", nullable = false, updatable = false, length = 64)
    private String viewerKey;

    @Column(name = "first_viewed_at", nullable = false, updatable = false)
    private Instant firstViewedAt;

    @Column(name = "last_viewed_at", nullable = false)
    private Instant lastViewedAt;

    protected ResourceViewEntity() {
    }

    public ResourceViewEntity(UUID resourceId, UUID userId, String viewerKey, Instant viewedAt) {
        this.id = UUID.randomUUID();
        this.resourceId = resourceId;
        this.userId = userId;
        this.viewerKey = viewerKey;
        this.firstViewedAt = viewedAt;
        this.lastViewedAt = viewedAt;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public Instant getLastViewedAt() {
        return lastViewedAt;
    }

    public void touch(UUID viewerId, Instant viewedAt) {
        if (viewerId != null) {
            userId = viewerId;
        }
        lastViewedAt = viewedAt;
    }
}

package com.educhain.interaction.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@IdClass(ResourceLikeKey.class)
@Table(name = "resource_like")
public class ResourceLikeEntity {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Id
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ResourceLikeEntity() {
    }

    public ResourceLikeEntity(UUID userId, UUID resourceId) {
        this.userId = userId;
        this.resourceId = resourceId;
    }
}

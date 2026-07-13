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
@IdClass(CollectionItemKey.class)
@Table(name = "collection_item")
public class CollectionItemEntity {

    @Id
    @Column(name = "collection_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID collectionId;

    @Id
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CollectionItemEntity() {
    }

    public CollectionItemEntity(UUID collectionId, UUID resourceId) {
        this.collectionId = collectionId;
        this.resourceId = resourceId;
    }

    public UUID getCollectionId() {
        return collectionId;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

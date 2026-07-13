package com.educhain.interaction.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "resource_collection")
public class CollectionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID ownerId;

    @Column(name = "display_name", nullable = false, length = 60)
    private String displayName;

    @Column(name = "name_normalized", nullable = false, length = 60)
    private String nameNormalized;

    @Column(name = "is_default", nullable = false, updatable = false)
    private boolean defaultCollection;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollectionEntity() {
    }

    public CollectionEntity(
            UUID id,
            UUID ownerId,
            String displayName,
            String nameNormalized,
            boolean defaultCollection
    ) {
        this.id = id;
        this.ownerId = ownerId;
        this.displayName = displayName;
        this.nameNormalized = nameNormalized;
        this.defaultCollection = defaultCollection;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isDefaultCollection() {
        return defaultCollection;
    }

    public long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void rename(String displayName, String nameNormalized) {
        this.displayName = displayName;
        this.nameNormalized = nameNormalized;
    }
}

package com.educhain.knowledge.entity;

import com.educhain.knowledge.domain.ResourceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "knowledge_resource")
public class KnowledgeResourceEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "public_slug", nullable = false, length = 120)
    private String publicSlug;

    @Column(name = "author_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID authorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private ResourceStatus status;

    @Column(name = "current_public_version_id", columnDefinition = "BINARY(16)")
    private UUID currentPublicVersionId;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected KnowledgeResourceEntity() {
    }

    public KnowledgeResourceEntity(UUID id, String publicSlug, UUID authorId) {
        this.id = id;
        this.publicSlug = publicSlug;
        this.authorId = authorId;
        this.status = ResourceStatus.DRAFT;
    }

    public UUID getId() {
        return id;
    }

    public String getPublicSlug() {
        return publicSlug;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public UUID getCurrentPublicVersionId() {
        return currentPublicVersionId;
    }

    public long getVersion() {
        return version;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void withdraw(Instant now) {
        if (status != ResourceStatus.PUBLISHED) {
            throw new IllegalStateException("Only a published resource can be withdrawn");
        }
        status = ResourceStatus.WITHDRAWN;
        withdrawnAt = now;
    }

    public void restore() {
        if (status != ResourceStatus.WITHDRAWN || currentPublicVersionId == null) {
            throw new IllegalStateException("Only a withdrawn published resource can be restored");
        }
        status = ResourceStatus.PUBLISHED;
        withdrawnAt = null;
    }

    public void publish(UUID versionId, String slug, Instant now) {
        currentPublicVersionId = versionId;
        publicSlug = slug;
        status = ResourceStatus.PUBLISHED;
        publishedAt = now;
        withdrawnAt = null;
    }
}

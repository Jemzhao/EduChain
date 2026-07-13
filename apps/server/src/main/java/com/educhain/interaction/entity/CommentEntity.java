package com.educhain.interaction.entity;

import com.educhain.interaction.domain.CommentStatus;

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
@Table(name = "comment")
public class CommentEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "author_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID authorId;

    @Column(name = "parent_comment_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID parentCommentId;

    @Column(name = "root_comment_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID rootCommentId;

    @Column(name = "body_content", length = 2000)
    private String bodyContent;

    @Column(name = "moderation_body", length = 2000)
    private String moderationBody;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private CommentStatus status;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CommentEntity() {
    }

    public CommentEntity(
            UUID id,
            UUID resourceId,
            UUID authorId,
            UUID parentCommentId,
            UUID rootCommentId,
            String bodyContent
    ) {
        this.id = id;
        this.resourceId = resourceId;
        this.authorId = authorId;
        this.parentCommentId = parentCommentId;
        this.rootCommentId = rootCommentId;
        this.bodyContent = bodyContent;
        this.status = CommentStatus.VISIBLE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public UUID getParentCommentId() {
        return parentCommentId;
    }

    public UUID getRootCommentId() {
        return rootCommentId;
    }

    public String getBodyContent() {
        return bodyContent;
    }

    public CommentStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }

    public void hide() {
        if (status != CommentStatus.VISIBLE) {
            throw new IllegalStateException("Only a visible comment can be hidden");
        }
        moderationBody = bodyContent;
        bodyContent = null;
        status = CommentStatus.HIDDEN;
    }

    public void restore() {
        if (status != CommentStatus.HIDDEN) {
            throw new IllegalStateException("Only a governance-hidden comment can be restored");
        }
        bodyContent = moderationBody;
        moderationBody = null;
        status = CommentStatus.VISIBLE;
    }

    public void softDelete(Instant now) {
        if (status == CommentStatus.DELETED) return;
        bodyContent = null;
        moderationBody = null;
        status = CommentStatus.DELETED;
        deletedAt = now;
    }
}

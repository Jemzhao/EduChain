package com.educhain.file.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "upload_session")
public class UploadSessionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "file_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID fileId;

    @Column(name = "owner_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private UploadStatus status;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UploadSessionEntity() {
    }

    public UploadSessionEntity(UUID id, UUID fileId, UUID ownerId, Instant expiresAt) {
        this.id = id;
        this.fileId = fileId;
        this.ownerId = ownerId;
        this.status = UploadStatus.CREATED;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getFileId() {
        return fileId;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public UploadStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void begin(Instant now) {
        requireNotExpired(now);
        if (status != UploadStatus.CREATED && status != UploadStatus.UPLOADING) {
            throw new IllegalStateException("Upload session cannot receive content");
        }
        status = UploadStatus.UPLOADING;
    }

    public void received(Instant now) {
        requireNotExpired(now);
        status = UploadStatus.RECEIVED;
    }

    public void complete(Instant now) {
        status = UploadStatus.COMPLETED;
        completedAt = now;
    }

    public void reject(Instant now) {
        status = UploadStatus.REJECTED;
        completedAt = now;
    }

    private void requireNotExpired(Instant now) {
        if (!expiresAt.isAfter(now)) {
            status = UploadStatus.EXPIRED;
            throw new IllegalStateException("Upload session expired");
        }
    }
}

package com.educhain.file.entity;

import com.educhain.file.domain.FileStatus;

import com.educhain.file.domain.UploadPurpose;

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
@Table(name = "file_object")
public class FileObjectEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, updatable = false, length = 32)
    private UploadPurpose purpose;

    @Column(name = "storage_provider", nullable = false, updatable = false, length = 32)
    private String storageProvider;

    @Column(name = "storage_key", nullable = false, updatable = false, length = 320)
    private String storageKey;

    @Column(name = "original_file_name", nullable = false, updatable = false, length = 255)
    private String originalFileName;

    @Column(name = "declared_size", nullable = false, updatable = false)
    private long declaredSize;

    @Column(name = "received_size")
    private Long receivedSize;

    @Column(name = "declared_media_type", nullable = false, updatable = false, length = 120)
    private String declaredMediaType;

    @Column(name = "detected_media_type", length = 120)
    private String detectedMediaType;

    @Column(name = "sha256", length = 64)
    private String sha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private FileStatus status;

    @Column(name = "rejection_code", length = 80)
    private String rejectionCode;

    @Column(name = "retention_until")
    private Instant retentionUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FileObjectEntity() {
    }

    public FileObjectEntity(
            UUID id,
            UUID ownerId,
            UploadPurpose purpose,
            String storageKey,
            String originalFileName,
            long declaredSize,
            String declaredMediaType,
            Instant retentionUntil
    ) {
        this.id = id;
        this.ownerId = ownerId;
        this.purpose = purpose;
        this.storageProvider = "LOCAL";
        this.storageKey = storageKey;
        this.originalFileName = originalFileName;
        this.declaredSize = declaredSize;
        this.declaredMediaType = declaredMediaType;
        this.status = FileStatus.CREATED;
        this.retentionUntil = retentionUntil;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public UploadPurpose getPurpose() {
        return purpose;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public long getDeclaredSize() {
        return declaredSize;
    }

    public Long getReceivedSize() {
        return receivedSize;
    }

    public String getDeclaredMediaType() {
        return declaredMediaType;
    }

    public String getDetectedMediaType() {
        return detectedMediaType;
    }

    public String getSha256() {
        return sha256;
    }

    public FileStatus getStatus() {
        return status;
    }

    public String getRejectionCode() {
        return rejectionCode;
    }

    public void beginUpload() {
        if (status != FileStatus.CREATED && status != FileStatus.UPLOADING) {
            throw new IllegalStateException("File is not uploadable");
        }
        status = FileStatus.UPLOADING;
    }

    public void markReceived(long size) {
        receivedSize = size;
        status = FileStatus.SCANNING;
    }

    public void makeAvailable(String mediaType, String digest) {
        detectedMediaType = mediaType;
        sha256 = digest;
        rejectionCode = null;
        retentionUntil = null;
        status = FileStatus.AVAILABLE;
    }

    public void reject(String code, String mediaType) {
        detectedMediaType = mediaType;
        rejectionCode = code;
        status = FileStatus.REJECTED;
    }
}

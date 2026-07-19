package com.educhain.evidence.entity;

import com.educhain.evidence.domain.CertificateStatus;

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
@Table(name = "certificate_artifact")
public class CertificateArtifactEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "evidence_record_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID evidenceRecordId;

    @Column(name = "template_version", nullable = false, updatable = false, length = 40)
    private String templateVersion;

    @Column(name = "object_key", length = 320)
    private String objectKey;

    @Column(name = "media_type", nullable = false, length = 80)
    private String mediaType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "sha256", length = 64)
    private String sha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private CertificateStatus status;

    @Column(name = "last_error_code", length = 80)
    private String lastErrorCode;

    @Column(name = "generated_at")
    private Instant generatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CertificateArtifactEntity() {
    }

    public CertificateArtifactEntity(UUID evidenceRecordId, String templateVersion) {
        this.id = UUID.randomUUID();
        this.evidenceRecordId = evidenceRecordId;
        this.templateVersion = templateVersion;
        this.mediaType = "application/pdf";
        this.status = CertificateStatus.PENDING;
    }

    public void available(
            String objectKey,
            long sizeBytes,
            String sha256,
            Instant generatedAt
    ) {
        this.objectKey = objectKey;
        this.sizeBytes = sizeBytes;
        this.sha256 = sha256;
        this.generatedAt = generatedAt;
        status = CertificateStatus.AVAILABLE;
        lastErrorCode = null;
    }

    public void failed(String errorCode) {
        status = CertificateStatus.FAILED;
        lastErrorCode = errorCode;
    }

    public UUID getId() { return id; }
    public UUID getEvidenceRecordId() { return evidenceRecordId; }
    public String getTemplateVersion() { return templateVersion; }
    public String getObjectKey() { return objectKey; }
    public String getMediaType() { return mediaType; }
    public Long getSizeBytes() { return sizeBytes; }
    public String getSha256() { return sha256; }
    public CertificateStatus getStatus() { return status; }
    public Instant getGeneratedAt() { return generatedAt; }
}

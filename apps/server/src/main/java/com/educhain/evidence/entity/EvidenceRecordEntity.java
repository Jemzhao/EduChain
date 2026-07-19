package com.educhain.evidence.entity;

import com.educhain.evidence.domain.EvidenceBackendType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "evidence_record")
public class EvidenceRecordEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "job_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID jobId;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "version_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID versionId;

    @Column(name = "author_proof_id", nullable = false, updatable = false, length = 128)
    private String authorProofId;

    @Column(name = "content_digest", nullable = false, updatable = false, length = 64)
    private String contentDigest;

    @Column(name = "attachment_merkle_root", updatable = false, length = 64)
    private String attachmentMerkleRoot;

    @Column(name = "canonicalization_version", nullable = false, updatable = false, length = 32)
    private String canonicalizationVersion;

    @Column(name = "payload_version", nullable = false, updatable = false)
    private short payloadVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "backend", nullable = false, updatable = false, length = 24)
    private EvidenceBackendType backend;

    @Column(name = "network_id", nullable = false, updatable = false, length = 120)
    private String networkId;

    @Column(name = "transaction_id", updatable = false, length = 160)
    private String transactionId;

    @Column(name = "block_height", updatable = false)
    private Long blockHeight;

    @Column(name = "block_hash", updatable = false, length = 160)
    private String blockHash;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @Column(name = "confirmed_at", nullable = false, updatable = false)
    private Instant confirmedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_response", nullable = false, updatable = false, columnDefinition = "JSON")
    private String rawResponse;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EvidenceRecordEntity() {
    }

    public EvidenceRecordEntity(
            UUID id,
            UUID jobId,
            UUID resourceId,
            UUID versionId,
            String authorProofId,
            String contentDigest,
            String attachmentMerkleRoot,
            String canonicalizationVersion,
            short payloadVersion,
            EvidenceBackendType backend,
            String networkId,
            String transactionId,
            Long blockHeight,
            String blockHash,
            Instant submittedAt,
            Instant confirmedAt,
            String rawResponse
    ) {
        this.id = id;
        this.jobId = jobId;
        this.resourceId = resourceId;
        this.versionId = versionId;
        this.authorProofId = authorProofId;
        this.contentDigest = contentDigest;
        this.attachmentMerkleRoot = attachmentMerkleRoot;
        this.canonicalizationVersion = canonicalizationVersion;
        this.payloadVersion = payloadVersion;
        this.backend = backend;
        this.networkId = networkId;
        this.transactionId = transactionId;
        this.blockHeight = blockHeight;
        this.blockHash = blockHash;
        this.submittedAt = submittedAt;
        this.confirmedAt = confirmedAt;
        this.rawResponse = rawResponse;
    }

    public UUID getId() { return id; }
    public UUID getJobId() { return jobId; }
    public UUID getResourceId() { return resourceId; }
    public UUID getVersionId() { return versionId; }
    public String getAuthorProofId() { return authorProofId; }
    public String getContentDigest() { return contentDigest; }
    public String getAttachmentMerkleRoot() { return attachmentMerkleRoot; }
    public String getCanonicalizationVersion() { return canonicalizationVersion; }
    public short getPayloadVersion() { return payloadVersion; }
    public EvidenceBackendType getBackend() { return backend; }
    public String getNetworkId() { return networkId; }
    public String getTransactionId() { return transactionId; }
    public Long getBlockHeight() { return blockHeight; }
    public String getBlockHash() { return blockHash; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
}

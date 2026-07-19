package com.educhain.evidence.entity;

import com.educhain.evidence.domain.EvidenceBackendType;

import com.educhain.evidence.domain.EvidenceJobStatus;

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
@Table(name = "evidence_job")
public class EvidenceJobEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "version_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID versionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "backend", nullable = false, updatable = false, length = 24)
    private EvidenceBackendType backend;

    @Column(name = "idempotency_key", nullable = false, updatable = false, length = 128)
    private String idempotencyKey;

    @Column(name = "payload_version", nullable = false, updatable = false)
    private short payloadVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private EvidenceJobStatus status;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "next_attempt_at")
    private Instant nextAttemptAt;

    @Column(name = "lease_until")
    private Instant leaseUntil;

    @Column(name = "last_error_code", length = 80)
    private String lastErrorCode;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected EvidenceJobEntity() {
    }

    public EvidenceJobEntity(
            UUID resourceId,
            UUID versionId,
            EvidenceBackendType backend,
            String idempotencyKey,
            short payloadVersion
    ) {
        this.id = UUID.randomUUID();
        this.resourceId = resourceId;
        this.versionId = versionId;
        this.backend = backend;
        this.idempotencyKey = idempotencyKey;
        this.payloadVersion = payloadVersion;
        this.status = EvidenceJobStatus.PENDING;
    }

    public void beginSubmission(Instant leaseUntil) {
        status = EvidenceJobStatus.SUBMITTING;
        attemptCount++;
        this.leaseUntil = leaseUntil;
        nextAttemptAt = null;
        lastErrorCode = null;
    }

    public void beginConfirmation(Instant leaseUntil) {
        status = EvidenceJobStatus.CONFIRMING;
        this.leaseUntil = leaseUntil;
        nextAttemptAt = null;
    }

    public void accepted(Instant nextAttemptAt) {
        status = EvidenceJobStatus.ACCEPTED;
        this.nextAttemptAt = nextAttemptAt;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public void unknown(String errorCode, Instant nextAttemptAt) {
        status = EvidenceJobStatus.UNKNOWN;
        lastErrorCode = errorCode;
        this.nextAttemptAt = nextAttemptAt;
        leaseUntil = null;
    }

    public void retry(String errorCode, Instant nextAttemptAt) {
        status = EvidenceJobStatus.RETRY_WAIT;
        lastErrorCode = errorCode;
        this.nextAttemptAt = nextAttemptAt;
        leaseUntil = null;
    }

    public void confirmed() {
        status = EvidenceJobStatus.CONFIRMED;
        nextAttemptAt = null;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public void certificatePending() {
        status = EvidenceJobStatus.CERTIFICATE_PENDING;
        attemptCount++;
    }

    public void completed() {
        status = EvidenceJobStatus.COMPLETED;
        nextAttemptAt = null;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public void certificateFailed(String errorCode, Instant nextAttemptAt) {
        status = EvidenceJobStatus.CERTIFICATE_FAILED;
        lastErrorCode = errorCode;
        this.nextAttemptAt = nextAttemptAt;
        leaseUntil = null;
    }

    public void terminate(String errorCode) {
        status = EvidenceJobStatus.TERMINATED;
        lastErrorCode = errorCode;
        nextAttemptAt = null;
        leaseUntil = null;
    }

    public void manualRetry(Instant now) {
        if (status == EvidenceJobStatus.COMPLETED) {
            throw new IllegalStateException("A completed evidence job cannot be retried");
        }
        status = EvidenceJobStatus.RETRY_WAIT;
        nextAttemptAt = now;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public EvidenceBackendType getBackend() {
        return backend;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public short getPayloadVersion() {
        return payloadVersion;
    }

    public EvidenceJobStatus getStatus() {
        return status;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public Instant getNextAttemptAt() {
        return nextAttemptAt;
    }

    public String getLastErrorCode() {
        return lastErrorCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

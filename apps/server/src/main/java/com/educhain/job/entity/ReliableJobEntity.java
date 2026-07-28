package com.educhain.job.entity;

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
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "reliable_job")
public class ReliableJobEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "job_type", nullable = false, updatable = false, length = 80)
    private String jobType;

    @Column(name = "business_key", nullable = false, updatable = false, length = 160)
    private String businessKey;

    @Column(name = "payload_version", nullable = false, updatable = false)
    private short payloadVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, updatable = false, columnDefinition = "JSON")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private ReliableJobStatus status;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "available_at", nullable = false)
    private Instant availableAt;

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

    protected ReliableJobEntity() {
    }

    public ReliableJobEntity(String jobType, String businessKey, String payload, Instant availableAt) {
        this.id = UUID.randomUUID();
        this.jobType = jobType;
        this.businessKey = businessKey;
        this.payloadVersion = 1;
        this.payload = payload;
        this.status = ReliableJobStatus.PENDING;
        this.availableAt = availableAt;
    }

    public void claim(Instant leaseUntil) {
        status = ReliableJobStatus.RUNNING;
        attemptCount++;
        this.leaseUntil = leaseUntil;
        lastErrorCode = null;
    }

    public void complete() {
        status = ReliableJobStatus.COMPLETED;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public void reschedule(Instant availableAt, String errorCode) {
        status = ReliableJobStatus.RETRY_WAIT;
        this.availableAt = availableAt;
        leaseUntil = null;
        lastErrorCode = errorCode;
    }

    public void terminate(String errorCode) {
        status = ReliableJobStatus.TERMINATED;
        leaseUntil = null;
        lastErrorCode = errorCode;
    }

    public void manualRetry(Instant availableAt) {
        if (status == ReliableJobStatus.COMPLETED) {
            throw new IllegalStateException("A completed job cannot be retried");
        }
        status = ReliableJobStatus.RETRY_WAIT;
        this.availableAt = availableAt;
        leaseUntil = null;
        lastErrorCode = null;
    }

    public UUID getId() {
        return id;
    }

    public String getJobType() {
        return jobType;
    }

    public String getBusinessKey() {
        return businessKey;
    }

    public String getPayload() {
        return payload;
    }

    public int getAttemptCount() {
        return attemptCount;
    }
}

package com.educhain.maintenance.entity;

import com.educhain.maintenance.domain.MaintenanceJobType;

import com.educhain.maintenance.domain.MaintenanceJobStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "admin_maintenance_job")
public class MaintenanceJobEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;
    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, updatable = false, length = 40)
    private MaintenanceJobType jobType;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private MaintenanceJobStatus status;
    @Column(name = "requested_by", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID requestedBy;
    @Column(name = "reason", nullable = false, updatable = false, length = 500)
    private String reason;
    @Column(name = "payload_summary", nullable = false, updatable = false, length = 200)
    private String payloadSummary;
    @Column(name = "result_summary", length = 200)
    private String resultSummary;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "completed_at")
    private Instant completedAt;

    protected MaintenanceJobEntity() {
    }

    public MaintenanceJobEntity(
            UUID id,
            MaintenanceJobType jobType,
            UUID requestedBy,
            String reason,
            String payloadSummary
    ) {
        this.id = id;
        this.jobType = jobType;
        this.requestedBy = requestedBy;
        this.reason = reason;
        this.payloadSummary = payloadSummary;
        this.status = MaintenanceJobStatus.ACCEPTED;
    }

    public UUID getId() { return id; }
    public MaintenanceJobType getJobType() { return jobType; }
    public MaintenanceJobStatus getStatus() { return status; }
    public UUID getRequestedBy() { return requestedBy; }
    public String getPayloadSummary() { return payloadSummary; }
    public String getResultSummary() { return resultSummary; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }

    public void complete(String resultSummary, Instant completedAt) {
        this.status = MaintenanceJobStatus.COMPLETED;
        this.resultSummary = resultSummary;
        this.completedAt = completedAt;
    }

    public void accept(String resultSummary) {
        this.resultSummary = resultSummary;
    }

    public void fail(String resultSummary, Instant completedAt) {
        this.status = MaintenanceJobStatus.FAILED;
        this.resultSummary = resultSummary;
        this.completedAt = completedAt;
    }
}

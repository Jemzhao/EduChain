package com.educhain.interaction.entity;

import com.educhain.interaction.domain.ReportTargetType;

import com.educhain.interaction.domain.ReportReason;

import com.educhain.interaction.domain.ReportStatus;

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
@Table(name = "report")
public class ReportEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "reporter_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID reporterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, updatable = false, length = 24)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, updatable = false, length = 32)
    private ReportReason reason;

    @Column(name = "details", nullable = false, updatable = false, length = 500)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private ReportStatus status;

    @Column(name = "resolution", length = 500)
    private String resolution;

    @Column(name = "resolved_by", columnDefinition = "BINARY(16)")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "open_deduplication_key", length = 64)
    private String openDeduplicationKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ReportEntity() {
    }

    public ReportEntity(
            UUID reporterId,
            ReportTargetType targetType,
            UUID targetId,
            ReportReason reason,
            String details,
            String openDeduplicationKey
    ) {
        this.id = UUID.randomUUID();
        this.reporterId = reporterId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.details = details;
        this.status = ReportStatus.OPEN;
        this.openDeduplicationKey = openDeduplicationKey;
    }

    public void resolve(ReportStatus status, String resolution, UUID actorId, Instant now) {
        if (this.status != ReportStatus.OPEN || status == ReportStatus.OPEN) {
            throw new IllegalStateException("Only an open report can be resolved or dismissed");
        }
        this.status = status;
        this.resolution = resolution;
        this.resolvedBy = actorId;
        this.resolvedAt = now;
        this.openDeduplicationKey = null;
    }

    public UUID getId() { return id; }
    public UUID getReporterId() { return reporterId; }
    public ReportTargetType getTargetType() { return targetType; }
    public UUID getTargetId() { return targetId; }
    public ReportReason getReason() { return reason; }
    public String getDetails() { return details; }
    public ReportStatus getStatus() { return status; }
    public String getResolution() { return resolution; }
    public UUID getResolvedBy() { return resolvedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

package com.educhain.admin.entity;

import com.educhain.admin.domain.OperationalAlertStatus;

import com.educhain.admin.domain.OperationalAlertSeverity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "operational_alert")
public class OperationalAlertEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 16)
    private OperationalAlertSeverity severity;

    @Column(name = "component_name", nullable = false, length = 80)
    private String componentName;

    @Column(name = "summary_code", nullable = false, length = 100)
    private String summaryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OperationalAlertStatus status;

    @Column(name = "occurrence_count", nullable = false)
    private long occurrenceCount;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolved_by", columnDefinition = "BINARY(16)")
    private UUID resolvedBy;

    @Column(name = "resolution_reason", length = 500)
    private String resolutionReason;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected OperationalAlertEntity() {
    }

    public OperationalAlertEntity(
            OperationalAlertSeverity severity,
            String componentName,
            String summaryCode,
            Instant now
    ) {
        this.id = UUID.randomUUID();
        this.severity = severity;
        this.componentName = componentName;
        this.summaryCode = summaryCode;
        this.status = OperationalAlertStatus.OPEN;
        this.occurrenceCount = 1;
        this.firstSeenAt = now;
        this.lastSeenAt = now;
    }

    public void observe(OperationalAlertSeverity currentSeverity, Instant now) {
        severity = currentSeverity;
        occurrenceCount += 1;
        lastSeenAt = now;
    }

    public void resolve(UUID actorId, String reason, Instant now) {
        status = OperationalAlertStatus.RESOLVED;
        resolvedAt = now;
        resolvedBy = actorId;
        resolutionReason = reason;
    }

    public UUID getId() { return id; }
    public OperationalAlertSeverity getSeverity() { return severity; }
    public String getComponentName() { return componentName; }
    public String getSummaryCode() { return summaryCode; }
    public OperationalAlertStatus getStatus() { return status; }
    public long getOccurrenceCount() { return occurrenceCount; }
    public Instant getFirstSeenAt() { return firstSeenAt; }
    public Instant getLastSeenAt() { return lastSeenAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public UUID getResolvedBy() { return resolvedBy; }
    public String getResolutionReason() { return resolutionReason; }
    public long getVersion() { return version; }
}

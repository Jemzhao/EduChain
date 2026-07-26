package com.educhain.audit.entity;

import com.educhain.audit.domain.AuditResultStatus;

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
@Table(name = "audit_event")
public class AuditEventEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "actor_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID actorId;

    @Column(name = "action_name", nullable = false, updatable = false, length = 100)
    private String actionName;

    @Column(name = "target_type", nullable = false, updatable = false, length = 80)
    private String targetType;

    @Column(name = "target_id", nullable = false, updatable = false, length = 160)
    private String targetId;

    @Column(name = "reason", updatable = false, length = 500)
    private String reason;

    @Column(name = "request_id", nullable = false, updatable = false, length = 128)
    private String requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, updatable = false, length = 24)
    private AuditResultStatus resultStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "context", nullable = false, updatable = false, columnDefinition = "JSON")
    private String context;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditEventEntity() {
    }

    public AuditEventEntity(
            UUID actorId,
            String actionName,
            String targetType,
            String targetId,
            String reason,
            String requestId,
            AuditResultStatus resultStatus,
            String context
    ) {
        this.id = UUID.randomUUID();
        this.actorId = actorId;
        this.actionName = actionName;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.requestId = requestId;
        this.resultStatus = resultStatus;
        this.context = context;
    }

    public UUID getId() { return id; }
    public UUID getActorId() { return actorId; }
    public String getActionName() { return actionName; }
    public String getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public String getReason() { return reason; }
    public String getRequestId() { return requestId; }
    public AuditResultStatus getResultStatus() { return resultStatus; }
    public Instant getCreatedAt() { return createdAt; }
}

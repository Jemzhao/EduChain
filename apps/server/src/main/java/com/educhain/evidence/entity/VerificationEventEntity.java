package com.educhain.evidence.entity;

import com.educhain.evidence.domain.VerificationResult;

import com.educhain.evidence.domain.VerificationMethod;

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
@Table(name = "verification_event")
public class VerificationEventEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "evidence_record_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID evidenceRecordId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, updatable = false, length = 24)
    private VerificationMethod method;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, updatable = false, length = 24)
    private VerificationResult result;

    @Column(name = "checked_digest", nullable = false, updatable = false, length = 64)
    private String checkedDigest;

    @Column(name = "caller_pseudonym", updatable = false, length = 64)
    private String callerPseudonym;

    @Column(name = "retention_until", nullable = false, updatable = false)
    private Instant retentionUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected VerificationEventEntity() {
    }

    public VerificationEventEntity(
            UUID id,
            UUID evidenceRecordId,
            VerificationMethod method,
            VerificationResult result,
            String checkedDigest,
            String callerPseudonym,
            Instant retentionUntil
    ) {
        this.id = id;
        this.evidenceRecordId = evidenceRecordId;
        this.method = method;
        this.result = result;
        this.checkedDigest = checkedDigest;
        this.callerPseudonym = callerPseudonym;
        this.retentionUntil = retentionUntil;
    }

    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
}

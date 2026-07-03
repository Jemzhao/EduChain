package com.educhain.shared.idempotency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "idempotency_record")
public class IdempotencyRecordEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "actor_id", columnDefinition = "BINARY(16)")
    private UUID actorId;

    @Column(name = "scope_name", nullable = false, updatable = false, length = 80)
    private String scopeName;

    @Column(name = "idempotency_key", nullable = false, updatable = false, length = 128)
    private String idempotencyKey;

    @Column(name = "request_digest", nullable = false, updatable = false, length = 64)
    private String requestDigest;

    @Column(name = "result_reference", length = 160)
    private String resultReference;

    @Column(name = "response_status", columnDefinition = "SMALLINT")
    private Integer responseStatus;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected IdempotencyRecordEntity() {
    }

    public IdempotencyRecordEntity(
            String scopeName,
            String idempotencyKey,
            String requestDigest,
            Instant expiresAt
    ) {
        this.scopeName = scopeName;
        this.idempotencyKey = idempotencyKey;
        this.requestDigest = requestDigest;
        this.expiresAt = expiresAt;
    }

    public String getRequestDigest() {
        return requestDigest;
    }

    public String getResultReference() {
        return resultReference;
    }

    public Integer getResponseStatus() {
        return responseStatus;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void complete(UUID actorId, String resultReference, int responseStatus) {
        this.actorId = actorId;
        this.resultReference = resultReference;
        this.responseStatus = responseStatus;
    }
}

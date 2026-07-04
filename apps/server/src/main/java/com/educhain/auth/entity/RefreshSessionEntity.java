package com.educhain.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "refresh_session")
public class RefreshSessionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "token_hash", nullable = false, updatable = false, length = 64)
    private String tokenHash;

    @Column(name = "session_family_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID sessionFamilyId;

    @Column(name = "device_label", nullable = false, length = 120)
    private String deviceLabel;

    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;

    @Column(name = "ip_prefix_hash", length = 64)
    private String ipPrefixHash;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "rotated_at")
    private Instant rotatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshSessionEntity() {
    }

    public RefreshSessionEntity(
            UUID id,
            UUID userId,
            String tokenHash,
            UUID sessionFamilyId,
            String deviceLabel,
            String userAgentHash,
            String ipPrefixHash,
            Instant expiresAt
    ) {
        this.id = id;
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.sessionFamilyId = sessionFamilyId;
        this.deviceLabel = deviceLabel;
        this.userAgentHash = userAgentHash;
        this.ipPrefixHash = ipPrefixHash;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getSessionFamilyId() {
        return sessionFamilyId;
    }

    public String getDeviceLabel() {
        return deviceLabel;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isUsable(Instant now) {
        return revokedAt == null && rotatedAt == null && expiresAt.isAfter(now);
    }

    public boolean wasRotatedOrRevoked() {
        return rotatedAt != null || revokedAt != null;
    }

    public void rotate(Instant now) {
        rotatedAt = now;
    }

    public void revoke(Instant now) {
        if (revokedAt == null) {
            revokedAt = now;
        }
    }
}

package com.educhain.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_credential")
public class AuthCredentialEntity {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "password_algorithm", nullable = false, length = 32)
    private String passwordAlgorithm;

    @Column(name = "password_changed_at", nullable = false)
    private Instant passwordChangedAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    protected AuthCredentialEntity() {
    }

    public AuthCredentialEntity(UUID userId, String passwordHash, Instant now) {
        this.userId = userId;
        this.passwordHash = passwordHash;
        this.passwordAlgorithm = "ARGON2ID";
        this.passwordChangedAt = now;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UUID getUserId() {
        return userId;
    }

    public boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void recordFailure(Instant now) {
        failedAttempts += 1;
        if (failedAttempts >= 8) {
            lockedUntil = now.plusSeconds(15 * 60L);
            failedAttempts = 0;
        }
    }

    public void recordSuccess() {
        failedAttempts = 0;
        lockedUntil = null;
    }

    public void changePassword(String passwordHash, Instant now) {
        this.passwordHash = passwordHash;
        this.passwordAlgorithm = "ARGON2ID";
        this.passwordChangedAt = now;
        this.failedAttempts = 0;
        this.lockedUntil = null;
    }
}

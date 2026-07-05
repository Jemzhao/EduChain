package com.educhain.user.entity;

import com.educhain.user.domain.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "user_account")
public class UserAccountEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "email_normalized", nullable = false, length = 254)
    private String emailNormalized;

    @Column(name = "handle_normalized", nullable = false, length = 32)
    private String handleNormalized;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private UserStatus status;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserAccountEntity() {
    }

    public UserAccountEntity(String emailNormalized, String handleNormalized) {
        this.emailNormalized = emailNormalized;
        this.handleNormalized = handleNormalized;
        this.status = UserStatus.ACTIVE;
    }

    public UUID getId() {
        return id;
    }

    public String getEmailNormalized() {
        return emailNormalized;
    }

    public String getHandleNormalized() {
        return handleNormalized;
    }

    public UserStatus getStatus() {
        return status;
    }

    public long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void changeStatus(UserStatus status) {
        this.status = status;
    }

    public void updateIdentity(String emailNormalized, String handleNormalized) {
        this.emailNormalized = emailNormalized;
        this.handleNormalized = handleNormalized;
    }
}

package com.educhain.user.entity;

import com.educhain.user.domain.UserRoleName;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@IdClass(UserRoleKey.class)
@Table(name = "user_role")
public class UserRoleEntity {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false, updatable = false, length = 32)
    private UserRoleName roleName;

    @Column(name = "granted_by", columnDefinition = "BINARY(16)")
    private UUID grantedBy;

    @CreationTimestamp
    @Column(name = "granted_at", nullable = false, updatable = false)
    private Instant grantedAt;

    protected UserRoleEntity() {
    }

    public UserRoleEntity(UUID userId, UserRoleName roleName) {
        this.userId = userId;
        this.roleName = roleName;
    }

    public UserRoleName getRoleName() {
        return roleName;
    }
}

package com.educhain.user.entity;

import com.educhain.user.domain.UserRoleName;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserRoleKey implements Serializable {

    private UUID userId;
    private UserRoleName roleName;

    public UserRoleKey() {
    }

    public UserRoleKey(UUID userId, UserRoleName roleName) {
        this.userId = userId;
        this.roleName = roleName;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof UserRoleKey that)) {
            return false;
        }
        return Objects.equals(userId, that.userId) && roleName == that.roleName;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, roleName);
    }
}

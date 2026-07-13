package com.educhain.interaction.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ResourceLikeKey implements Serializable {
    private UUID userId;
    private UUID resourceId;

    public ResourceLikeKey() {
    }

    public ResourceLikeKey(UUID userId, UUID resourceId) {
        this.userId = userId;
        this.resourceId = resourceId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof ResourceLikeKey that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(resourceId, that.resourceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, resourceId);
    }
}

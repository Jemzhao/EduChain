package com.educhain.social.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class FollowRelationKey implements Serializable {
    private UUID followerId;
    private UUID followedId;

    public FollowRelationKey() {
    }

    public FollowRelationKey(UUID followerId, UUID followedId) {
        this.followerId = followerId;
        this.followedId = followedId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof FollowRelationKey that)) return false;
        return Objects.equals(followerId, that.followerId)
                && Objects.equals(followedId, that.followedId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followedId);
    }
}

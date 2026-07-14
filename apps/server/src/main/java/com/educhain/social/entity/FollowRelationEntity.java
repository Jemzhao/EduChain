package com.educhain.social.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@IdClass(FollowRelationKey.class)
@Table(name = "follow_relation")
public class FollowRelationEntity {

    @Id
    @Column(name = "follower_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID followerId;

    @Id
    @Column(name = "followed_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID followedId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected FollowRelationEntity() {
    }

    public FollowRelationEntity(UUID followerId, UUID followedId) {
        this.followerId = followerId;
        this.followedId = followedId;
    }

    public UUID getFollowerId() {
        return followerId;
    }

    public UUID getFollowedId() {
        return followedId;
    }
}

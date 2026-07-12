package com.educhain.discovery.entity;

import com.educhain.discovery.domain.RecommendationFeedbackType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "recommendation_feedback")
public class RecommendationFeedbackEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;
    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type", nullable = false, length = 24)
    private RecommendationFeedbackType feedbackType;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected RecommendationFeedbackEntity() {
    }

    public RecommendationFeedbackEntity(UUID userId, UUID resourceId) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.resourceId = resourceId;
        this.feedbackType = RecommendationFeedbackType.DISMISSED;
    }

    public UUID getResourceId() { return resourceId; }
    public RecommendationFeedbackType getFeedbackType() { return feedbackType; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void dismiss() { this.feedbackType = RecommendationFeedbackType.DISMISSED; }
}

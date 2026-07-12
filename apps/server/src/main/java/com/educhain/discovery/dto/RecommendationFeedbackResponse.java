package com.educhain.discovery.dto;

import com.educhain.discovery.domain.RecommendationFeedbackType;
import java.time.Instant;
import java.util.UUID;

public record RecommendationFeedbackResponse(
        UUID resourceId,
        RecommendationFeedbackType feedback,
        Instant updatedAt
) {
}

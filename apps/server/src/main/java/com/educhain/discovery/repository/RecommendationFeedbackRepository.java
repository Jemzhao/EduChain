package com.educhain.discovery.repository;

import com.educhain.discovery.entity.RecommendationFeedbackEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationFeedbackRepository extends JpaRepository<RecommendationFeedbackEntity, UUID> {
    Optional<RecommendationFeedbackEntity> findByUserIdAndResourceId(UUID userId, UUID resourceId);
    List<RecommendationFeedbackEntity> findAllByUserId(UUID userId);
}

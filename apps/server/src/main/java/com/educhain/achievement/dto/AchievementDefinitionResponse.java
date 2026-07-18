package com.educhain.achievement.dto;

public record AchievementDefinitionResponse(
        String id,
        String titleKey,
        String descriptionKey,
        AchievementMetric metric,
        long target,
        int points
) {
}

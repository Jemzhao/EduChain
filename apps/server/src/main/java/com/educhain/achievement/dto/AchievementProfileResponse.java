package com.educhain.achievement.dto;

import java.util.List;

public record AchievementProfileResponse(
        long totalPoints,
        AchievementLevel level,
        Long nextLevelPoints,
        long unlockedCount,
        AchievementStatisticsResponse statistics,
        List<UserAchievementResponse> items
) {
    public AchievementProfileResponse {
        items = List.copyOf(items);
    }
}

package com.educhain.achievement.dto;

public record UserAchievementResponse(
        AchievementDefinitionResponse achievement,
        long current,
        boolean unlocked
) {
}

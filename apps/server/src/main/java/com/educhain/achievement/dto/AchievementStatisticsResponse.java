package com.educhain.achievement.dto;

public record AchievementStatisticsResponse(
        long publishedResources,
        long comments,
        long receivedLikes,
        long followers,
        long viewedResources
) {
}

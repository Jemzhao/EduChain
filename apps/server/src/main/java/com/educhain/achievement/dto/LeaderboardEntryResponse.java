package com.educhain.achievement.dto;

import com.educhain.knowledge.dto.ResourceAuthorResponse;

public record LeaderboardEntryResponse(
        int rank,
        ResourceAuthorResponse user,
        long points,
        AchievementLevel level,
        long publishedResources,
        long receivedLikes
) {
}

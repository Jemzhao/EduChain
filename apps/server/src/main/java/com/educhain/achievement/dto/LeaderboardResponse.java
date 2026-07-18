package com.educhain.achievement.dto;

import java.util.List;

public record LeaderboardResponse(List<LeaderboardEntryResponse> items) {
    public LeaderboardResponse {
        items = List.copyOf(items);
    }
}

package com.educhain.achievement.dto;

import java.util.List;

public record AchievementCatalogResponse(List<AchievementDefinitionResponse> items) {
    public AchievementCatalogResponse {
        items = List.copyOf(items);
    }
}

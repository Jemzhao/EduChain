package com.educhain.discovery.dto;

import java.util.UUID;

public record ResourceStatisticsResponse(
        UUID resourceId,
        long views,
        long likes,
        long saves,
        long comments
) {
}

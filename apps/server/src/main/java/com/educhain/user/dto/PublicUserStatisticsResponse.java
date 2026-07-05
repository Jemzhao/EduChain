package com.educhain.user.dto;

public record PublicUserStatisticsResponse(
        long publishedResources,
        long followers,
        long following
) {
}

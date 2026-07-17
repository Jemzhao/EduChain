package com.educhain.community.dto;

public record CommunityStatisticsResponse(
        long members,
        long publishedResources,
        long likes,
        long comments
) {
}

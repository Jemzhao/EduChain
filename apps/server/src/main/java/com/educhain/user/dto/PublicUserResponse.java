package com.educhain.user.dto;

public record PublicUserResponse(
        UserSummaryResponse user,
        ProfileDetailsResponse profile,
        PublicUserStatisticsResponse statistics
) {
}

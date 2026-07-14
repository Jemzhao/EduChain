package com.educhain.social.dto;

import java.util.UUID;

public record FollowStateResponse(
        UUID userId,
        boolean following,
        long followerCount,
        long followingCount
) {
}

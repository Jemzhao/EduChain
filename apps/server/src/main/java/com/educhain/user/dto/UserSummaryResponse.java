package com.educhain.user.dto;

import com.educhain.user.domain.UserStatus;
import java.net.URI;
import java.util.UUID;

public record UserSummaryResponse(
        UUID id,
        String handle,
        String displayName,
        URI avatarUrl,
        UserStatus status,
        long version
) {
}

package com.educhain.user.service;

import com.educhain.user.domain.UserStatus;
import java.util.UUID;

public record SocialUserSnapshot(
        UUID id,
        String handle,
        String displayName,
        String avatarUrl,
        UserStatus status
) {
}

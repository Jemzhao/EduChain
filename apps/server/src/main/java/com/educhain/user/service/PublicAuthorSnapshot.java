package com.educhain.user.service;

import java.util.UUID;

public record PublicAuthorSnapshot(
        UUID id,
        String handle,
        String displayName,
        String avatarUrl
) {
}

package com.educhain.knowledge.dto;

import java.util.UUID;

public record ResourceAuthorResponse(
        UUID id,
        String handle,
        String displayName,
        String avatarUrl
) {
}

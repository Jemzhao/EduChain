package com.educhain.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionSummaryResponse(
        UUID id,
        boolean current,
        String deviceLabel,
        Instant createdAt,
        Instant expiresAt
) {
}

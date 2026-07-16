package com.educhain.activity.dto;

import com.educhain.activity.domain.ActivityType;
import java.time.Instant;
import java.util.UUID;

public record ActivityItemResponse(
        UUID id,
        ActivityType type,
        UUID resourceId,
        Instant createdAt
) {
}

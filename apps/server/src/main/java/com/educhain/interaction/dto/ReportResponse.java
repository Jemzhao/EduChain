package com.educhain.interaction.dto;

import com.educhain.interaction.domain.ReportReason;
import com.educhain.interaction.domain.ReportStatus;
import com.educhain.interaction.domain.ReportTargetType;
import java.time.Instant;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        UUID reporterId,
        ReportTargetType targetType,
        UUID targetId,
        ReportReason reason,
        String details,
        ReportStatus status,
        String resolution,
        UUID resolvedBy,
        Instant createdAt,
        Instant updatedAt
) {
}

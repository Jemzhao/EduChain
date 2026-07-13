package com.educhain.interaction.dto;

import com.educhain.interaction.domain.ReportReason;
import com.educhain.interaction.domain.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateReportRequest(
        @NotNull ReportTargetType targetType,
        @NotNull UUID targetId,
        @NotNull ReportReason reason,
        @Size(max = 500) String details
) {
}

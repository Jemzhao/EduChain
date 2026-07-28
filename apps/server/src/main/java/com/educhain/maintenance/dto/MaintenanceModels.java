package com.educhain.maintenance.dto;

import com.educhain.maintenance.domain.MaintenanceJobStatus;
import com.educhain.maintenance.domain.MaintenanceJobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class MaintenanceModels {
    private MaintenanceModels() {
    }

    public record Request(
            @NotNull MaintenanceJobType type,
            @NotBlank @Size(min = 10, max = 500) String reason,
            @Size(max = 120) String announcementTitle,
            @Size(max = 1000) String announcementBody
    ) {
    }

    public record Response(
            UUID id,
            MaintenanceJobType type,
            MaintenanceJobStatus status,
            UUID requestedBy,
            String payloadSummary,
            String resultSummary,
            Instant createdAt,
            Instant completedAt
    ) {
    }

    public record ListResponse(List<Response> items) {
        public ListResponse { items = List.copyOf(items); }
    }
}

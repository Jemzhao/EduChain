package com.educhain.notification.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record NotificationReadBatchRequest(
        @NotNull NotificationReadBatchScope scope,
        @NotNull @Size(max = 100) List<UUID> notificationIds
) {
}

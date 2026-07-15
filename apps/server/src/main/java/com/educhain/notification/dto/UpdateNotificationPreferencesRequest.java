package com.educhain.notification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateNotificationPreferencesRequest(
        @NotNull @Size(min = 8, max = 8) List<@Valid UpdateNotificationPreferenceItemRequest> items
) {
}

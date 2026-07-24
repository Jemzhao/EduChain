package com.educhain.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePlatformSettingRequest(
        @NotNull @Size(max = 500) String value,
        @NotBlank @Size(min = 10, max = 500) String reason
) {
}

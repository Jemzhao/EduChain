package com.educhain.discovery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecordResourceViewRequest(
        @NotBlank @Size(min = 16, max = 128) String viewerKey
) {
}

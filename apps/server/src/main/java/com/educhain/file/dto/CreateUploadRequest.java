package com.educhain.file.dto;

import com.educhain.file.domain.UploadPurpose;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUploadRequest(
        @NotNull UploadPurpose purpose,
        @NotBlank @Size(max = 255) String fileName,
        @Min(1) @Max(26_214_400) long size,
        @NotBlank @Size(max = 120) String mediaType
) {
}

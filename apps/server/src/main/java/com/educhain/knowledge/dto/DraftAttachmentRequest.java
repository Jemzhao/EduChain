package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.DraftFilePurpose;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record DraftAttachmentRequest(
        @NotNull UUID fileId,
        @NotBlank @Size(max = 255) String displayName,
        @NotNull DraftFilePurpose purpose,
        @Min(0) int order
) {
}

package com.educhain.knowledge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record UpdateResourceDraftRequest(
        @NotNull @Size(max = 160) String title,
        @NotNull @Size(max = 600) String summary,
        @NotNull @Size(max = 100_000) String body,
        @NotNull @Size(max = 2048) String sourceUrl,
        UUID categoryId,
        @NotNull @Size(max = 8) List<UUID> tagIds,
        UUID coverFileId,
        @NotNull @Size(max = 10) List<@Valid DraftAttachmentRequest> attachments,
        @NotNull @Size(max = 500) String copyrightStatement
) {
    public UpdateResourceDraftRequest {
        tagIds = tagIds == null ? null : List.copyOf(tagIds);
        attachments = attachments == null ? null : List.copyOf(attachments);
    }
}

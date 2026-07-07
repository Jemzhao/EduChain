package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.domain.ResourceType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResourceDraftResponse(
        UUID resourceId,
        String slug,
        ResourceStatus status,
        long resourceVersion,
        long draftVersion,
        String title,
        String summary,
        String body,
        ResourceType resourceType,
        String sourceUrl,
        UUID categoryId,
        List<UUID> tagIds,
        UUID coverFileId,
        List<DraftAttachmentResponse> attachments,
        String copyrightStatement,
        Instant savedAt
) {
    public ResourceDraftResponse {
        tagIds = List.copyOf(tagIds);
        attachments = List.copyOf(attachments);
    }
}

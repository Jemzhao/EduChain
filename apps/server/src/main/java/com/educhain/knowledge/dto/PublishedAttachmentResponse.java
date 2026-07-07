package com.educhain.knowledge.dto;

import java.util.UUID;

public record PublishedAttachmentResponse(
        UUID fileId,
        String displayName,
        String mediaType,
        long size,
        String sha256
) {
}

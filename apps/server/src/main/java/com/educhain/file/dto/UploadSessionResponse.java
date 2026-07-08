package com.educhain.file.dto;

import java.time.Instant;
import java.util.UUID;

public record UploadSessionResponse(
        UUID uploadId,
        UUID fileId,
        String uploadUrl,
        String method,
        Instant expiresAt,
        long maxSize
) {
}

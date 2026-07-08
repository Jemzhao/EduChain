package com.educhain.file.service;

import com.educhain.file.domain.UploadPurpose;
import java.util.UUID;

public record FileSnapshot(
        UUID id,
        UUID ownerId,
        UploadPurpose purpose,
        String fileName,
        long size,
        String mediaType,
        String sha256
) {
}

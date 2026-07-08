package com.educhain.file.dto;

import com.educhain.file.domain.FileStatus;
import com.educhain.file.domain.UploadPurpose;
import java.util.UUID;

public record FileResponse(
        UUID id,
        UploadPurpose purpose,
        String fileName,
        long size,
        String declaredMediaType,
        String detectedMediaType,
        String sha256,
        FileStatus status,
        String rejectionCode
) {
}

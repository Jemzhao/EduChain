package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.DraftFilePurpose;
import java.util.UUID;

public record DraftAttachmentResponse(
        UUID fileId,
        String displayName,
        DraftFilePurpose purpose,
        int order
) {
}

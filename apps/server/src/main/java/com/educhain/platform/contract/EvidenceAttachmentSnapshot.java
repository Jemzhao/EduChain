package com.educhain.platform.contract;

public record EvidenceAttachmentSnapshot(
        int sortOrder,
        String purpose,
        String sha256
) {
}

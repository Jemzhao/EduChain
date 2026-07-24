package com.educhain.platform.contract;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EvidenceVersionSnapshot(
        UUID resourceId,
        String resourceSlug,
        UUID versionId,
        int versionNumber,
        String title,
        UUID authorId,
        String canonicalizationVersion,
        String contentDigest,
        Instant publishedAt,
        List<EvidenceAttachmentSnapshot> attachments
) {
}

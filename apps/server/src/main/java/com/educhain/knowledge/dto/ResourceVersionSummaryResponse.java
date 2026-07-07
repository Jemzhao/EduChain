package com.educhain.knowledge.dto;

import java.time.Instant;
import java.util.UUID;

public record ResourceVersionSummaryResponse(
        UUID id,
        int versionNumber,
        String title,
        String summary,
        String contentDigest,
        Instant publishedAt,
        boolean current
) {
}

package com.educhain.knowledge.service;

import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.domain.ResourceStatus;
import java.time.Instant;
import java.util.UUID;

public record GovernanceResourceView(
        UUID id,
        String slug,
        String title,
        ResourceAuthorResponse author,
        ResourceStatus status,
        long version,
        EvidenceProcessingStatus evidenceStatus,
        Instant publishedAt
) {
}

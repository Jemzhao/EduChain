package com.educhain.knowledge.service;

import com.educhain.knowledge.domain.ResourceStatus;
import java.util.UUID;

public record KnowledgeReferenceSnapshot(
        UUID id,
        UUID authorId,
        String slug,
        String title,
        ResourceStatus status
) {
}

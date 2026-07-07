package com.educhain.knowledge.dto;

import com.educhain.knowledge.domain.ResourceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateResourceDraftRequest(
        @Size(max = 160) String title,
        @NotNull ResourceType resourceType
) {
}

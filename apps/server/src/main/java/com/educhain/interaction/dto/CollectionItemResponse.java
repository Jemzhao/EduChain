package com.educhain.interaction.dto;

import com.educhain.knowledge.dto.ResourceCardResponse;
import java.time.Instant;
import java.util.UUID;

public record CollectionItemResponse(
        UUID collectionId,
        ResourceCardResponse resource,
        Instant savedAt
) {
}

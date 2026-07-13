package com.educhain.interaction.dto;

import java.time.Instant;
import java.util.UUID;

public record CollectionResponse(
        UUID id,
        String name,
        boolean defaultCollection,
        long itemCount,
        boolean containsResource,
        long version,
        Instant createdAt,
        Instant updatedAt
) {
}

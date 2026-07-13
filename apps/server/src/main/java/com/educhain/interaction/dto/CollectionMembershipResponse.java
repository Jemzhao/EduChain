package com.educhain.interaction.dto;

import java.time.Instant;
import java.util.UUID;

public record CollectionMembershipResponse(
        UUID collectionId,
        UUID resourceId,
        boolean saved,
        Instant savedAt
) {
}

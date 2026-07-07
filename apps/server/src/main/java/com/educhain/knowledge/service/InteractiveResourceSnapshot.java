package com.educhain.knowledge.service;

import com.educhain.knowledge.dto.ResourceCardResponse;
import java.util.UUID;

public record InteractiveResourceSnapshot(
        UUID id,
        UUID authorId,
        ResourceCardResponse resource
) {
}

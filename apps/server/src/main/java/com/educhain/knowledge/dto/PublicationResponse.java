package com.educhain.knowledge.dto;

public record PublicationResponse(
        ResourceDetailResponse resource,
        PublicationProcessingResponse processing
) {
}

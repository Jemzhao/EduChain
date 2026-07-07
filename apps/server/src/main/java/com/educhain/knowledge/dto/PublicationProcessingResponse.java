package com.educhain.knowledge.dto;

import com.educhain.platform.contract.EvidenceProcessingStatus;

public record PublicationProcessingResponse(
        SearchProcessingStatus search,
        EvidenceProcessingStatus evidence
) {
    public enum SearchProcessingStatus {
        PENDING,
        COMPLETED
    }
}

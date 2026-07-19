package com.educhain.evidence.dto;

import com.educhain.evidence.domain.CertificateStatus;
import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import java.time.Instant;
import java.util.UUID;

public record PublicEvidenceResponse(
        UUID proofId,
        UUID resourceId,
        String resourceSlug,
        String resourceTitle,
        UUID versionId,
        int versionNumber,
        ResourceAuthorResponse author,
        EvidenceBackendType backend,
        String networkId,
        String transactionId,
        Long blockHeight,
        String blockHash,
        String contentDigest,
        String attachmentMerkleRoot,
        String canonicalizationVersion,
        short payloadVersion,
        Instant submittedAt,
        Instant confirmedAt,
        CertificateStatus certificateStatus,
        String certificateUrl
) {
}

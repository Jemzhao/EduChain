package com.educhain.evidence.gateway;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record GatewayEvidencePayload(
        @JsonProperty("resource_id") UUID resourceId,
        @JsonProperty("version_id") UUID versionId,
        @JsonProperty("author_proof_id") String authorProofId,
        @JsonProperty("canonicalization_version") String canonicalizationVersion,
        @JsonProperty("payload_version") short payloadVersion,
        @JsonProperty("content_digest") String contentDigest,
        @JsonProperty("attachment_merkle_root") String attachmentMerkleRoot,
        @JsonProperty("published_at") Instant publishedAt
) {
}

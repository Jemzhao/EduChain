package com.educhain.evidence.gateway;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record GatewayCertificateArtifact(
        @JsonProperty("proof_id") UUID proofId,
        @JsonProperty("object_key") String objectKey,
        @JsonProperty("media_type") String mediaType,
        @JsonProperty("size_bytes") long sizeBytes,
        String sha256,
        @JsonProperty("template_version") String templateVersion,
        @JsonProperty("generated_at") Instant generatedAt
) {
}

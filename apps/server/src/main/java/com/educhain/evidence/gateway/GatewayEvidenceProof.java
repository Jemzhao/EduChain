package com.educhain.evidence.gateway;

import com.educhain.evidence.domain.EvidenceBackendType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record GatewayEvidenceProof(
        @JsonProperty("proof_id") UUID proofId,
        String status,
        EvidenceBackendType backend,
        @JsonProperty("network_id") String networkId,
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("block_height") Long blockHeight,
        @JsonProperty("block_hash") String blockHash,
        @JsonProperty("submitted_at") Instant submittedAt,
        @JsonProperty("confirmed_at") Instant confirmedAt,
        @JsonProperty("payload_digest") String payloadDigest,
        GatewayEvidencePayload payload
) {
}

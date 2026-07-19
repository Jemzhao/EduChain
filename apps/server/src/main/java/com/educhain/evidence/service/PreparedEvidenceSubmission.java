package com.educhain.evidence.service;

import com.educhain.evidence.gateway.GatewayEvidencePayload;
import com.educhain.platform.contract.EvidenceVersionSnapshot;
import java.util.UUID;

public record PreparedEvidenceSubmission(
        UUID jobId,
        UUID reliableJobId,
        String idempotencyKey,
        GatewayEvidencePayload payload,
        EvidenceVersionSnapshot version,
        boolean lookupOnly
) {
}

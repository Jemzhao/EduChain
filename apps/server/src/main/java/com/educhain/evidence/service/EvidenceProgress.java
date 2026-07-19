package com.educhain.evidence.service;

import java.util.UUID;

public record EvidenceProgress(
        boolean confirmed,
        boolean terminated,
        UUID proofId
) {
}

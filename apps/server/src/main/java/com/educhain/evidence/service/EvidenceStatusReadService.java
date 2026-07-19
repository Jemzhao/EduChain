package com.educhain.evidence.service;

import com.educhain.evidence.domain.EvidenceJobStatus;

import com.educhain.evidence.repository.EvidenceJobRepository;
import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.platform.port.EvidenceStatusPort;
import java.util.UUID;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvidenceStatusReadService implements EvidenceStatusPort {

    private final EvidenceJobRepository repository;

    public EvidenceStatusReadService(EvidenceJobRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceProcessingStatus status(UUID versionId) {
        return repository.findFirstByVersionIdOrderByCreatedAtDesc(versionId)
                .map(job -> toStatus(job.getStatus()))
                .orElse(EvidenceProcessingStatus.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, EvidenceProcessingStatus> statuses(Collection<UUID> versionIds) {
        Map<UUID, EvidenceProcessingStatus> result = new HashMap<>();
        repository.findAllByVersionIdIn(versionIds).stream()
                .sorted(Comparator.comparing(job -> job.getCreatedAt()))
                .forEach(job -> result.put(job.getVersionId(), toStatus(job.getStatus())));
        versionIds.forEach(versionId -> result.putIfAbsent(
                versionId,
                EvidenceProcessingStatus.PENDING
        ));
        return Map.copyOf(result);
    }

    private EvidenceProcessingStatus toStatus(
            com.educhain.evidence.domain.EvidenceJobStatus status
    ) {
        return switch (status) {
            case PENDING -> EvidenceProcessingStatus.PENDING;
            case SUBMITTING, ACCEPTED, UNKNOWN, CONFIRMING, RETRY_WAIT ->
                    EvidenceProcessingStatus.PROCESSING;
            case CONFIRMED, CERTIFICATE_PENDING, CERTIFICATE_FAILED, COMPLETED ->
                    EvidenceProcessingStatus.CONFIRMED;
            case TERMINATED -> EvidenceProcessingStatus.TERMINATED;
        };
    }
}

package com.educhain.evidence.service;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.dto.EvidenceIntegrityResponse;
import com.educhain.evidence.dto.EvidenceIntegrityStatus;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.evidence.entity.EvidenceJobEntity;
import com.educhain.evidence.domain.EvidenceJobStatus;
import com.educhain.evidence.repository.EvidenceJobRepository;
import com.educhain.evidence.repository.EvidenceRecordRepository;
import com.educhain.job.service.ReliableJobService;
import com.educhain.platform.contract.EvidenceVersionSnapshot;
import com.educhain.platform.port.KnowledgeEvidencePort;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvidenceGovernanceService {

    private static final String RELIABLE_JOB_TYPE = "EVIDENCE_SUBMIT_VERSION";
    private static final List<EvidenceJobStatus> RETRYABLE = List.of(
            EvidenceJobStatus.UNKNOWN,
            EvidenceJobStatus.RETRY_WAIT,
            EvidenceJobStatus.CERTIFICATE_FAILED,
            EvidenceJobStatus.TERMINATED
    );

    private final EvidenceJobRepository repository;
    private final EvidenceRecordRepository records;
    private final ReliableJobService reliableJobs;
    private final KnowledgeEvidencePort knowledge;
    private final EvidenceProperties properties;
    private final Clock clock;

    public EvidenceGovernanceService(
            EvidenceJobRepository repository,
            EvidenceRecordRepository records,
            ReliableJobService reliableJobs,
            KnowledgeEvidencePort knowledge,
            EvidenceProperties properties,
            Clock clock
    ) {
        this.repository = repository;
        this.records = records;
        this.reliableJobs = reliableJobs;
        this.knowledge = knowledge;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<EvidenceJobResponse> list(EvidenceJobStatus status, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        return (status == null
                ? repository.findAll(page)
                : repository.findAllByStatusOrderByUpdatedAtDesc(status, page)).map(this::response);
    }

    @Transactional
    public EvidenceJobResponse retry(UUID jobId) {
        EvidenceJobEntity job = repository.findById(jobId).orElseThrow(this::notFound);
        if (!RETRYABLE.contains(job.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "This evidence job is not eligible for manual retry",
                    false,
                    Map.of("status", job.getStatus().name())
            );
        }
        job.manualRetry(clock.instant());
        if (!reliableJobs.manualRetry(RELIABLE_JOB_TYPE, job.getVersionId().toString())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "Reliable evidence work item is unavailable",
                    false,
                    Map.of("jobId", jobId.toString())
            );
        }
        repository.flush();
        return response(job);
    }

    @Transactional
    public EvidenceJobResponse request(UUID resourceId) {
        EvidenceVersionSnapshot version = knowledge.requireCurrentVersion(resourceId);
        var existing = repository.findByVersionIdAndBackendAndPayloadVersion(
                version.versionId(),
                properties.backend(),
                EvidenceStateService.PAYLOAD_VERSION
        );
        if (existing.isPresent()) {
            EvidenceJobEntity job = existing.orElseThrow();
            return RETRYABLE.contains(job.getStatus()) ? retry(job.getId()) : response(job);
        }
        boolean scheduled;
        try {
            scheduled = reliableJobs.manualRetry(
                    RELIABLE_JOB_TYPE,
                    version.versionId().toString()
            );
        } catch (IllegalStateException exception) {
            scheduled = false;
        }
        if (!scheduled) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "Reliable evidence work item is unavailable",
                    false,
                    Map.of("versionId", version.versionId().toString())
            );
        }
        EvidenceJobEntity job = repository.save(new EvidenceJobEntity(
                version.resourceId(),
                version.versionId(),
                properties.backend(),
                "evidence-v1:" + properties.backend().name().toLowerCase()
                        + ":" + version.versionId(),
                EvidenceStateService.PAYLOAD_VERSION
        ));
        repository.flush();
        return response(job);
    }

    @Transactional(readOnly = true)
    public EvidenceIntegrityResponse integrity() {
        var evidenceRecords = records.findAll();
        Map<UUID, EvidenceJobEntity> jobsById = repository
                .findAllById(evidenceRecords.stream().map(record -> record.getJobId()).toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(EvidenceJobEntity::getId, job -> job));
        long orphanRecords = evidenceRecords.stream()
                .filter(record -> !jobsById.containsKey(record.getJobId()))
                .count();
        long mismatchedRecords = evidenceRecords.stream()
                .filter(record -> {
                    EvidenceJobEntity job = jobsById.get(record.getJobId());
                    return job != null && (!job.getResourceId().equals(record.getResourceId())
                            || !job.getVersionId().equals(record.getVersionId())
                            || job.getBackend() != record.getBackend());
                })
                .count();
        return new EvidenceIntegrityResponse(
                orphanRecords == 0 && mismatchedRecords == 0
                        ? EvidenceIntegrityStatus.CONSISTENT
                        : EvidenceIntegrityStatus.ATTENTION_REQUIRED,
                repository.count(),
                evidenceRecords.size(),
                orphanRecords,
                mismatchedRecords,
                clock.instant()
        );
    }

    @Transactional(readOnly = true)
    public long retryableCount() {
        return repository.countByStatusIn(RETRYABLE);
    }

    private EvidenceJobResponse response(EvidenceJobEntity job) {
        return new EvidenceJobResponse(
                job.getId(),
                job.getResourceId(),
                job.getVersionId(),
                job.getBackend(),
                job.getStatus(),
                job.getAttemptCount(),
                RETRYABLE.contains(job.getStatus()),
                job.getLastErrorCode(),
                job.getNextAttemptAt(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.EVIDENCE_JOB_NOT_FOUND,
                "Evidence job was not found",
                false,
                Map.of()
        );
    }
}

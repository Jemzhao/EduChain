package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.service.AuditService;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.evidence.domain.EvidenceJobStatus;
import com.educhain.evidence.service.EvidenceGovernanceService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminEvidenceService {

    private final EvidenceGovernanceService evidence;
    private final AuditService audit;
    private final AdminModelMapper mapper;

    public AdminEvidenceService(
            EvidenceGovernanceService evidence,
            AuditService audit,
            AdminModelMapper mapper
    ) {
        this.evidence = evidence;
        this.audit = audit;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminModels.EvidenceJobListResponse evidenceJobs(EvidenceJobStatus status, int limit) {
        Page<EvidenceJobResponse> page = evidence.list(status, limit);
        return new AdminModels.EvidenceJobListResponse(page.getContent(), mapper.pageInfo(page));
    }

    @Transactional
    public EvidenceJobResponse retryEvidence(
            UUID actorId,
            UUID jobId,
            String reason,
            String requestId
    ) {
        EvidenceJobResponse job = evidence.retry(jobId);
        audit.succeeded(actorId, "EVIDENCE_RETRY_SCHEDULED", "EVIDENCE_JOB", jobId, reason, requestId);
        return job;
    }

    @Transactional
    public EvidenceJobResponse requestEvidence(
            UUID actorId,
            UUID resourceId,
            String reason,
            String requestId
    ) {
        EvidenceJobResponse job = evidence.request(resourceId);
        audit.succeeded(
                actorId,
                "EVIDENCE_REQUESTED",
                "RESOURCE",
                resourceId,
                reason,
                requestId
        );
        return job;
    }

    @Transactional(readOnly = true)
    public AdminModels.EvidenceIntegrityResponse evidenceIntegrity() {
        var integrity = evidence.integrity();
        return new AdminModels.EvidenceIntegrityResponse(
                AdminModels.EvidenceIntegrityStatus.valueOf(integrity.status().name()),
                integrity.totalJobs(),
                integrity.totalRecords(),
                integrity.orphanRecords(),
                integrity.mismatchedRecords(),
                integrity.checkedAt()
        );
    }
}

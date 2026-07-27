package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.evidence.service.EvidenceGovernanceService;
import com.educhain.interaction.service.InteractionGovernanceService;
import com.educhain.interaction.service.ReportService;
import com.educhain.knowledge.service.KnowledgeGovernanceService;
import com.educhain.user.service.UserGovernanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOverviewService {

    private final ReportService reports;
    private final UserGovernanceService users;
    private final KnowledgeGovernanceService resources;
    private final InteractionGovernanceService comments;
    private final EvidenceGovernanceService evidence;
    private final AdminObservabilityService observability;

    public AdminOverviewService(
            ReportService reports,
            UserGovernanceService users,
            KnowledgeGovernanceService resources,
            InteractionGovernanceService comments,
            EvidenceGovernanceService evidence,
            AdminObservabilityService observability
    ) {
        this.reports = reports;
        this.users = users;
        this.resources = resources;
        this.comments = comments;
        this.evidence = evidence;
        this.observability = observability;
    }

    @Transactional(readOnly = true)
    public AdminModels.OverviewResponse overview() {
        AdminModels.SystemHealthResponse health = observability.health();
        return new AdminModels.OverviewResponse(
                reports.openCount(),
                users.restrictedCount(),
                resources.withdrawnCount(),
                comments.hiddenCount(),
                evidence.retryableCount(),
                health.status()
        );
    }
}

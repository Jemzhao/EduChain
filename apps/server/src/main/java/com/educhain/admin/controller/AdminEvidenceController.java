package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminEvidenceService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.evidence.domain.EvidenceJobStatus;
import com.educhain.shared.api.RequestIdFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('MODERATOR', 'ADMINISTRATOR')")
public class AdminEvidenceController {

    private final AdminEvidenceService service;

    public AdminEvidenceController(AdminEvidenceService service) {
        this.service = service;
    }

    @GetMapping("/evidence-jobs")
    public AdminModels.EvidenceJobListResponse evidenceJobs(
            @RequestParam(required = false) EvidenceJobStatus status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.evidenceJobs(status, limit);
    }

    @PostMapping("/evidence-jobs/{jobId}/retries")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public EvidenceJobResponse retryEvidenceJob(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID jobId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.retryEvidence(
                principal.userId(),
                jobId,
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/resources/{resourceId}/evidence-requests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public EvidenceJobResponse requestEvidence(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.requestEvidence(
                principal.userId(),
                resourceId,
                request.reason().trim(),
                requestId
        );
    }

    @GetMapping("/evidence-integrity")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.EvidenceIntegrityResponse evidenceIntegrity() {
        return service.evidenceIntegrity();
    }
}

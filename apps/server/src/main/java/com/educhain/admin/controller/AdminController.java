package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminObservabilityService;
import com.educhain.admin.service.AdminOverviewService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('MODERATOR', 'ADMINISTRATOR')")
public class AdminController {

    private final AdminOverviewService overviewService;
    private final AdminObservabilityService observabilityService;

    public AdminController(
            AdminOverviewService overviewService,
            AdminObservabilityService observabilityService
    ) {
        this.overviewService = overviewService;
        this.observabilityService = observabilityService;
    }

    @GetMapping("/overview")
    public AdminModels.OverviewResponse overview() {
        return overviewService.overview();
    }

    @GetMapping("/audit-events")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.AuditEventListResponse auditEvents(
            @RequestParam(required = false) @Size(max = 80) String targetType,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return observabilityService.auditEvents(targetType, limit);
    }

    @GetMapping("/system-health")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.SystemHealthResponse systemHealth() {
        return observabilityService.health();
    }

    @GetMapping("/operational-metrics")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.OperationalMetricsResponse operationalMetrics() {
        return observabilityService.operationalMetrics();
    }

    @GetMapping("/operational-events")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.OperationalEventListResponse operationalEvents(
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return observabilityService.operationalEvents(limit);
    }

    @GetMapping("/operational-alerts")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.OperationalAlertListResponse operationalAlerts() {
        return observabilityService.operationalAlerts();
    }

    @PutMapping("/operational-alerts/{alertId}/resolution")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.OperationalAlertResponse resolveOperationalAlert(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID alertId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return observabilityService.resolveOperationalAlert(
                principal.userId(),
                alertId,
                EntityTagVersions.parse(ifMatch),
                request.reason().trim(),
                requestId
        );
    }
}

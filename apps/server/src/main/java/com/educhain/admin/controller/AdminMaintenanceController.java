package com.educhain.admin.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.maintenance.dto.MaintenanceModels;
import com.educhain.maintenance.service.MaintenanceService;
import com.educhain.shared.api.RequestIdFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/maintenance-jobs")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminMaintenanceController {
    private final MaintenanceService maintenance;

    public AdminMaintenanceController(MaintenanceService maintenance) {
        this.maintenance = maintenance;
    }

    @GetMapping
    public MaintenanceModels.ListResponse list(
            @RequestParam(defaultValue = "30") @Min(1) @Max(50) int limit
    ) {
        return maintenance.list(limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MaintenanceModels.Response request(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody MaintenanceModels.Request request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return maintenance.request(principal.userId(), request, requestId);
    }
}

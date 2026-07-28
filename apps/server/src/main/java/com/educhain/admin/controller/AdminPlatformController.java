package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminStatisticsService;
import com.educhain.admin.service.AdminPlatformService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.platform.dto.PlatformSettingListResponse;
import com.educhain.platform.dto.PlatformSettingResponse;
import com.educhain.platform.dto.UpdatePlatformSettingRequest;
import com.educhain.platform.service.PlatformSettingService;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminPlatformController {

    private final PlatformSettingService settings;
    private final AdminStatisticsService statistics;
    private final AdminPlatformService platform;

    public AdminPlatformController(
            PlatformSettingService settings,
            AdminStatisticsService statistics,
            AdminPlatformService platform
    ) {
        this.settings = settings;
        this.statistics = statistics;
        this.platform = platform;
    }

    @GetMapping("/statistics")
    public AdminModels.StatisticsResponse statistics() {
        return statistics.statistics();
    }

    @PostMapping("/statistics/exports")
    public ResponseEntity<byte[]> exportStatistics(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        byte[] csv = platform.exportStatistics(
                principal.userId(),
                request.reason().trim(),
                requestId
        );
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=educhain-statistics.csv")
                .body(csv);
    }

    @GetMapping("/settings")
    public PlatformSettingListResponse settings() {
        return settings.all();
    }

    @PutMapping("/settings/{settingKey}")
    public PlatformSettingResponse update(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable String settingKey,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody UpdatePlatformSettingRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return platform.update(
                principal.userId(),
                settingKey,
                EntityTagVersions.parse(ifMatch),
                request.value(),
                request.reason().trim(),
                requestId
        );
    }
}

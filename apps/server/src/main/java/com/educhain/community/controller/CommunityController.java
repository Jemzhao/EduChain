package com.educhain.community.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.community.dto.CommunityFeedScope;
import com.educhain.community.dto.CommunityOverviewResponse;
import com.educhain.community.service.CommunityService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/community")
public class CommunityController {

    private final CommunityService service;

    public CommunityController(CommunityService service) {
        this.service = service;
    }

    @GetMapping
    public CommunityOverviewResponse overview(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "GLOBAL") CommunityFeedScope scope,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int limit
    ) {
        return service.overview(principal == null ? null : principal.userId(), scope, cursor, limit);
    }
}

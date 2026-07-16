package com.educhain.activity.controller;

import com.educhain.activity.dto.ActivityListResponse;
import com.educhain.activity.service.ActivityService;
import com.educhain.platform.security.EduChainPrincipal;
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
@RequestMapping("/api/v1/users/me/activity")
public class ActivityController {

    private final ActivityService service;

    public ActivityController(ActivityService service) {
        this.service = service;
    }

    @GetMapping
    public ActivityListResponse activity(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit
    ) {
        return service.list(principal.userId(), limit);
    }
}

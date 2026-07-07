package com.educhain.knowledge.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.knowledge.dto.MyResourceListResponse;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.service.ResourceWorkspaceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/resources")
public class CreatorResourceController {

    private final ResourceWorkspaceService workspaceService;

    public CreatorResourceController(ResourceWorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public MyResourceListResponse resources(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(required = false) ResourceStatus status
    ) {
        return workspaceService.listOwned(principal.userId(), status);
    }
}

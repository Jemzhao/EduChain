package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminContentService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.interaction.dto.ReportResponse;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.domain.ReportStatus;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.shared.api.RequestIdFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('MODERATOR', 'ADMINISTRATOR')")
public class AdminContentController {

    private final AdminContentService service;

    public AdminContentController(AdminContentService service) {
        this.service = service;
    }

    @GetMapping("/resources")
    public AdminModels.ResourceListResponse resources(
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.resourceList(status, limit);
    }

    @PostMapping("/resource-review-batches")
    public AdminModels.BatchResultResponse reviewResources(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.ResourceReviewBatchRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.reviewResources(principal.userId(), request, requestId);
    }

    @PostMapping(value = "/resource-exports", produces = "text/csv")
    public String exportResources(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.exportResources(principal.userId(), request.reason().trim(), requestId);
    }

    @PostMapping("/resources/{resourceId}/withdrawals")
    public AdminModels.ResourceResponse withdrawResource(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.withdrawResource(
                principal.userId(),
                resourceId,
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/resources/{resourceId}/restorations")
    public AdminModels.ResourceResponse restoreResource(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.restoreResource(
                principal.userId(),
                resourceId,
                request.reason().trim(),
                requestId
        );
    }

    @GetMapping("/comments")
    public AdminModels.CommentListResponse comments(
            @RequestParam(required = false) CommentStatus status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.commentList(status, limit);
    }

    @PostMapping("/comments/{commentId}/hiding")
    public AdminModels.CommentResponse hideComment(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID commentId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.hideComment(
                principal.userId(),
                commentId,
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/comments/{commentId}/restorations")
    public AdminModels.CommentResponse restoreComment(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID commentId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.restoreComment(
                principal.userId(),
                commentId,
                request.reason().trim(),
                requestId
        );
    }

    @GetMapping("/reports")
    public AdminModels.ReportListResponse reports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.reportList(status, limit);
    }

    @PutMapping("/reports/{reportId}/resolution")
    public ReportResponse resolveReport(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID reportId,
            @Valid @RequestBody AdminModels.ReportResolutionRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.resolveReport(principal.userId(), reportId, request, requestId);
    }
}

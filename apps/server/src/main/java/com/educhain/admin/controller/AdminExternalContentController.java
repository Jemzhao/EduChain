package com.educhain.admin.controller;

import com.educhain.admin.service.AdminExternalContentService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.externalcontent.dto.ExternalContentModels;
import com.educhain.externalcontent.domain.ExternalQualityStatus;
import com.educhain.externalcontent.service.ExternalContentService;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/external-content")
@PreAuthorize("hasAnyRole('MODERATOR','ADMINISTRATOR')")
public class AdminExternalContentController {
    private final ExternalContentService content;
    private final AdminExternalContentService admin;

    public AdminExternalContentController(
            ExternalContentService content,
            AdminExternalContentService admin
    ) {
        this.content = content;
        this.admin = admin;
    }

    @GetMapping("/sources")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ExternalContentModels.SourceListResponse sources() {
        return content.sources();
    }

    @PostMapping("/sources")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ExternalContentModels.SourceResponse create(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody ExternalContentModels.SourceWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return admin.create(principal.userId(), request, requestId);
    }

    @PutMapping("/sources/{sourceId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ExternalContentModels.SourceResponse update(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID sourceId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody ExternalContentModels.SourceWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return admin.update(
                principal.userId(),
                sourceId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PostMapping("/sources/{sourceId}/sync")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ExternalContentModels.SyncResponse sync(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID sourceId,
            @Valid @RequestBody ExternalContentModels.SyncRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return admin.sync(
                principal.userId(),
                sourceId,
                request.reason().trim(),
                requestId
        );
    }

    @GetMapping("/items")
    public ExternalContentModels.ItemListResponse items(
            @RequestParam(required = false) ExternalQualityStatus status,
            @RequestParam(defaultValue = "30") @Min(1) @Max(50) int limit
    ) {
        return content.reviewQueue(status, limit);
    }

    @PutMapping("/items/{itemId}/review")
    public ExternalContentModels.ItemResponse review(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID itemId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody ExternalContentModels.ReviewRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return admin.review(
                principal.userId(),
                itemId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }
}

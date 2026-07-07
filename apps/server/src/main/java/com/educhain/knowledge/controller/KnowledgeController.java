package com.educhain.knowledge.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.knowledge.dto.CreateResourceDraftRequest;
import com.educhain.knowledge.dto.PublicationResponse;
import com.educhain.knowledge.dto.ResourceDetailResponse;
import com.educhain.knowledge.dto.ResourceDraftResponse;
import com.educhain.knowledge.dto.ResourceListResponse;
import com.educhain.knowledge.dto.MyResourceSummaryResponse;
import com.educhain.knowledge.dto.ResourceLifecycleRequest;
import com.educhain.knowledge.dto.ResourceSort;
import com.educhain.knowledge.dto.ResourceVersionListResponse;
import com.educhain.knowledge.dto.RestoreResourceVersionRequest;
import com.educhain.knowledge.dto.UpdateResourceDraftRequest;
import com.educhain.knowledge.service.ResourceDraftService;
import com.educhain.knowledge.service.ResourcePublicationService;
import com.educhain.knowledge.service.ResourceQueryService;
import com.educhain.knowledge.service.ResourceWorkspaceService;
import com.educhain.shared.http.EntityTagVersions;
import com.educhain.shared.api.RequestIdFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/resources")
public class KnowledgeController {

    private final ResourceDraftService draftService;
    private final ResourcePublicationService publicationService;
    private final ResourceQueryService queryService;
    private final ResourceWorkspaceService workspaceService;

    public KnowledgeController(
            ResourceDraftService draftService,
            ResourcePublicationService publicationService,
            ResourceQueryService queryService,
            ResourceWorkspaceService workspaceService
    ) {
        this.draftService = draftService;
        this.publicationService = publicationService;
        this.queryService = queryService;
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public ResourceListResponse resources(
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "RELEVANCE") ResourceSort sort
    ) {
        return queryService.list(cursor, limit, category, tag, sort);
    }

    @PostMapping
    public ResponseEntity<ResourceDraftResponse> createDraft(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey,
            @Valid @RequestBody CreateResourceDraftRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(draftService.create(principal.userId(), idempotencyKey, request));
    }

    @GetMapping("/{resourceKey}")
    public ResourceDetailResponse resource(@PathVariable @Size(min = 3, max = 120) String resourceKey) {
        return queryService.get(resourceKey);
    }

    @GetMapping("/{resourceId}/draft")
    public ResourceDraftResponse draft(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId
    ) {
        return draftService.get(principal.userId(), resourceId);
    }

    @PatchMapping("/{resourceId}/draft")
    public ResponseEntity<ResourceDraftResponse> updateDraft(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody UpdateResourceDraftRequest request
    ) {
        ResourceDraftResponse response = draftService.update(
                principal.userId(),
                resourceId,
                EntityTagVersions.parse(ifMatch),
                request
        );
        return ResponseEntity.ok()
                .eTag(Long.toString(response.draftVersion()))
                .body(response);
    }

    @PostMapping("/{resourceId}/publications")
    public ResponseEntity<PublicationResponse> publish(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(publicationService.publish(
                principal.userId(),
                resourceId,
                EntityTagVersions.parse(ifMatch),
                idempotencyKey
        ));
    }

    @GetMapping("/{resourceId}/versions")
    public ResourceVersionListResponse versions(@PathVariable UUID resourceId) {
        return workspaceService.versions(resourceId);
    }

    @PostMapping("/{resourceId}/draft-restorations")
    public ResponseEntity<ResourceDraftResponse> restoreVersion(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody RestoreResourceVersionRequest request
    ) {
        ResourceDraftResponse response = workspaceService.restore(
                principal.userId(),
                resourceId,
                EntityTagVersions.parse(ifMatch),
                request.versionId()
        );
        return ResponseEntity.ok()
                .eTag(Long.toString(response.draftVersion()))
                .body(response);
    }

    @PostMapping("/{resourceId}/withdrawals")
    public MyResourceSummaryResponse withdraw(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody ResourceLifecycleRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return workspaceService.withdraw(
                principal.userId(),
                resourceId,
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/{resourceId}/restorations")
    public MyResourceSummaryResponse restorePublication(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody ResourceLifecycleRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return workspaceService.restorePublication(
                principal.userId(),
                resourceId,
                request.reason().trim(),
                requestId
        );
    }
}

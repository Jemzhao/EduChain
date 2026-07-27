package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminTaxonomyService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('MODERATOR', 'ADMINISTRATOR')")
public class AdminTaxonomyController {

    private final AdminTaxonomyService service;

    public AdminTaxonomyController(AdminTaxonomyService service) {
        this.service = service;
    }

    @GetMapping("/taxonomy")
    public AdminModels.TaxonomyResponse taxonomy() {
        return service.taxonomy();
    }

    @PutMapping("/categories/{categoryId}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem changeCategoryStatus(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID categoryId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.TaxonomyStatusRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.changeCategoryStatus(
                principal.userId(),
                categoryId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem createCategory(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.CategoryWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.createCategory(principal.userId(), request, requestId);
    }

    @PutMapping("/categories/{categoryId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem updateCategory(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID categoryId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.CategoryWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.updateCategory(
                principal.userId(),
                categoryId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @DeleteMapping("/categories/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public void deleteCategory(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID categoryId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        service.deleteCategory(
                principal.userId(),
                categoryId,
                EntityTagVersions.parse(ifMatch),
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/categories/{categoryId}/merges")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem mergeCategory(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID categoryId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.TaxonomyMergeRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.mergeCategory(
                principal.userId(),
                categoryId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PutMapping("/tags/{tagId}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem changeTagStatus(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID tagId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.TaxonomyStatusRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.changeTagStatus(
                principal.userId(),
                tagId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PostMapping("/tags")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem createTag(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.TagWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.createTag(principal.userId(), request, requestId);
    }

    @PutMapping("/tags/{tagId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem updateTag(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID tagId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.TagWriteRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.updateTag(
                principal.userId(),
                tagId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @DeleteMapping("/tags/{tagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public void deleteTag(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID tagId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        service.deleteTag(
                principal.userId(),
                tagId,
                EntityTagVersions.parse(ifMatch),
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/tags/{tagId}/merges")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.TaxonomyItem mergeTag(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID tagId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.TaxonomyMergeRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.mergeTag(
                principal.userId(),
                tagId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PostMapping("/taxonomy-deletion-batches")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.BatchResultResponse deleteTaxonomy(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.TaxonomyDeletionBatchRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.deleteTaxonomy(principal.userId(), request, requestId);
    }
}

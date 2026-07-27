package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.service.AuditService;
import com.educhain.taxonomy.service.GovernanceTaxonomyView;
import com.educhain.taxonomy.service.TaxonomyGovernanceService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminTaxonomyService {

    private final TaxonomyGovernanceService taxonomy;
    private final AuditService audit;
    private final AdminModelMapper mapper;

    public AdminTaxonomyService(
            TaxonomyGovernanceService taxonomy,
            AuditService audit,
            AdminModelMapper mapper
    ) {
        this.taxonomy = taxonomy;
        this.audit = audit;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminModels.TaxonomyResponse taxonomy() {
        return new AdminModels.TaxonomyResponse(taxonomy.list().stream()
                .map(mapper::taxonomy)
                .toList());
    }

    @Transactional
    public AdminModels.TaxonomyItem changeCategoryStatus(
            UUID actorId,
            UUID categoryId,
            long expectedVersion,
            AdminModels.TaxonomyStatusRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.changeCategoryStatus(
                categoryId,
                expectedVersion,
                request.status()
        );
        audit.succeeded(
                actorId,
                "CATEGORY_STATUS_CHANGED",
                "CATEGORY",
                categoryId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem createCategory(
            UUID actorId,
            AdminModels.CategoryWriteRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.createCategory(
                request.slug(),
                request.label(),
                request.description(),
                request.parentId(),
                request.order()
        );
        audit.succeeded(
                actorId,
                "CATEGORY_CREATED",
                "CATEGORY",
                view.id(),
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem updateCategory(
            UUID actorId,
            UUID categoryId,
            long expectedVersion,
            AdminModels.CategoryWriteRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.updateCategory(
                categoryId,
                expectedVersion,
                request.slug(),
                request.label(),
                request.description(),
                request.parentId(),
                request.order()
        );
        audit.succeeded(
                actorId,
                "CATEGORY_UPDATED",
                "CATEGORY",
                categoryId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem mergeCategory(
            UUID actorId,
            UUID categoryId,
            long expectedVersion,
            AdminModels.TaxonomyMergeRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.mergeCategory(
                categoryId,
                expectedVersion,
                request.targetId()
        );
        audit.succeeded(
                actorId,
                "CATEGORY_MERGED",
                "CATEGORY",
                categoryId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem changeTagStatus(
            UUID actorId,
            UUID tagId,
            long expectedVersion,
            AdminModels.TaxonomyStatusRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.changeTagStatus(
                tagId,
                expectedVersion,
                request.status()
        );
        audit.succeeded(
                actorId,
                "TAG_STATUS_CHANGED",
                "TAG",
                tagId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem createTag(
            UUID actorId,
            AdminModels.TagWriteRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.createTag(
                request.slug(),
                request.label(),
                request.description()
        );
        audit.succeeded(
                actorId,
                "TAG_CREATED",
                "TAG",
                view.id(),
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem updateTag(
            UUID actorId,
            UUID tagId,
            long expectedVersion,
            AdminModels.TagWriteRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.updateTag(
                tagId,
                expectedVersion,
                request.slug(),
                request.label(),
                request.description()
        );
        audit.succeeded(
                actorId,
                "TAG_UPDATED",
                "TAG",
                tagId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public AdminModels.TaxonomyItem mergeTag(
            UUID actorId,
            UUID tagId,
            long expectedVersion,
            AdminModels.TaxonomyMergeRequest request,
            String requestId
    ) {
        GovernanceTaxonomyView view = taxonomy.mergeTag(
                tagId,
                expectedVersion,
                request.targetId()
        );
        audit.succeeded(
                actorId,
                "TAG_MERGED",
                "TAG",
                tagId,
                request.reason().trim(),
                requestId
        );
        return mapper.taxonomy(view);
    }

    @Transactional
    public void deleteCategory(
            UUID actorId,
            UUID categoryId,
            long expectedVersion,
            String reason,
            String requestId
    ) {
        taxonomy.deleteCategory(categoryId, expectedVersion);
        audit.succeeded(actorId, "CATEGORY_DELETED", "CATEGORY", categoryId, reason, requestId);
    }

    @Transactional
    public void deleteTag(
            UUID actorId,
            UUID tagId,
            long expectedVersion,
            String reason,
            String requestId
    ) {
        taxonomy.deleteTag(tagId, expectedVersion);
        audit.succeeded(actorId, "TAG_DELETED", "TAG", tagId, reason, requestId);
    }

    @Transactional
    public AdminModels.BatchResultResponse deleteTaxonomy(
            UUID actorId,
            AdminModels.TaxonomyDeletionBatchRequest request,
            String requestId
    ) {
        int processed = 0;
        for (AdminModels.TaxonomyDeletionRef item : request.items()) {
            if (item.kind() == AdminModels.TaxonomyKind.CATEGORY) {
                deleteCategory(actorId, item.id(), item.version(), request.reason().trim(), requestId);
            } else {
                deleteTag(actorId, item.id(), item.version(), request.reason().trim(), requestId);
            }
            processed += 1;
        }
        return new AdminModels.BatchResultResponse(processed);
    }
}

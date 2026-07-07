package com.educhain.knowledge.service;

import com.educhain.audit.service.AuditService;
import com.educhain.knowledge.dto.MyResourceListResponse;
import com.educhain.knowledge.dto.MyResourceSummaryResponse;
import com.educhain.knowledge.dto.ResourceDraftResponse;
import com.educhain.knowledge.dto.ResourceVersionListResponse;
import com.educhain.knowledge.dto.ResourceVersionSummaryResponse;
import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeDraftFileRepository;
import com.educhain.knowledge.repository.KnowledgeDraftRepository;
import com.educhain.knowledge.repository.KnowledgeDraftTagRepository;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionFileRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.knowledge.repository.KnowledgeVersionTagRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceWorkspaceService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeDraftRepository draftRepository;
    private final KnowledgeDraftTagRepository draftTagRepository;
    private final KnowledgeDraftFileRepository draftFileRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final KnowledgeVersionTagRepository versionTagRepository;
    private final KnowledgeVersionFileRepository versionFileRepository;
    private final ResourceResponseFactory responseFactory;
    private final Clock clock;
    private final AuditService audit;

    public ResourceWorkspaceService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeDraftRepository draftRepository,
            KnowledgeDraftTagRepository draftTagRepository,
            KnowledgeDraftFileRepository draftFileRepository,
            KnowledgeVersionRepository versionRepository,
            KnowledgeVersionTagRepository versionTagRepository,
            KnowledgeVersionFileRepository versionFileRepository,
            ResourceResponseFactory responseFactory,
            Clock clock,
            AuditService audit
    ) {
        this.resourceRepository = resourceRepository;
        this.draftRepository = draftRepository;
        this.draftTagRepository = draftTagRepository;
        this.draftFileRepository = draftFileRepository;
        this.versionRepository = versionRepository;
        this.versionTagRepository = versionTagRepository;
        this.versionFileRepository = versionFileRepository;
        this.responseFactory = responseFactory;
        this.clock = clock;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public MyResourceListResponse listOwned(UUID authorId, ResourceStatus status) {
        List<MyResourceSummaryResponse> items = resourceRepository
                .findAllByAuthorIdOrderByUpdatedAtDesc(authorId)
                .stream()
                .filter(resource -> status == null || resource.getStatus() == status)
                .map(this::summary)
                .toList();
        return new MyResourceListResponse(items);
    }

    @Transactional(readOnly = true)
    public ResourceVersionListResponse versions(UUID resourceId) {
        KnowledgeResourceEntity resource = resourceRepository.findById(resourceId)
                .filter(item -> item.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(this::notFound);
        List<ResourceVersionSummaryResponse> items = versionRepository
                .findAllByResourceIdOrderByVersionNumberDesc(resourceId)
                .stream()
                .map(version -> new ResourceVersionSummaryResponse(
                        version.getId(),
                        version.getVersionNumber(),
                        version.getTitle(),
                        version.getSummary(),
                        version.getContentDigest(),
                        version.getPublishedAt(),
                        version.getId().equals(resource.getCurrentPublicVersionId())
                ))
                .toList();
        return new ResourceVersionListResponse(resourceId, items);
    }

    @Transactional
    public ResourceDraftResponse restore(
            UUID authorId,
            UUID resourceId,
            long expectedDraftVersion,
            UUID versionId
    ) {
        KnowledgeResourceEntity resource = resourceRepository
                .findLockedByIdAndAuthorId(resourceId, authorId)
                .orElseThrow(this::notFound);
        if (resource.getStatus() == ResourceStatus.WITHDRAWN) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.DRAFT_NOT_EDITABLE,
                    "Draft is not editable",
                    false,
                    Map.of()
            );
        }
        KnowledgeDraftEntity draft = draftRepository.findById(resourceId)
                .orElseThrow(this::notFound);
        if (draft.getVersion() != expectedDraftVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Draft version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(draft.getVersion()))
            );
        }
        KnowledgeVersionEntity version = versionRepository.findByIdAndResourceId(versionId, resourceId)
                .orElseThrow(this::notFound);

        draftTagRepository.deleteAllByResourceId(resourceId);
        draftTagRepository.flush();
        var versionTags = versionTagRepository.findAllByVersionIdOrderBySortOrderAsc(versionId);
        for (var tag : versionTags) {
            draftTagRepository.save(new com.educhain.knowledge.entity.KnowledgeDraftTagEntity(
                    resourceId,
                    tag.getTagId(),
                    tag.getSortOrder()
            ));
        }

        draftFileRepository.deleteAllByResourceId(resourceId);
        draftFileRepository.flush();
        var versionFiles = versionFileRepository.findAllByVersionIdOrderBySortOrderAsc(versionId);
        for (var file : versionFiles) {
            draftFileRepository.save(new KnowledgeDraftFileEntity(
                    resourceId,
                    file.getFileId(),
                    file.getDisplayName(),
                    file.getPurpose(),
                    file.getSortOrder()
            ));
        }

        draft.update(
                version.getTitle(),
                version.getSummary(),
                version.getBodyContent(),
                version.getSourceUrl(),
                version.getCategoryId(),
                version.getCoverFileId(),
                version.getCopyrightStatement(),
                clock.instant()
        );
        draftRepository.flush();
        return responseFactory.draft(resource, draft);
    }

    @Transactional
    public MyResourceSummaryResponse withdraw(
            UUID authorId,
            UUID resourceId,
            String reason,
            String requestId
    ) {
        KnowledgeResourceEntity resource = resourceRepository
                .findLockedByIdAndAuthorId(resourceId, authorId)
                .orElseThrow(this::notFound);
        try {
            resource.withdraw(clock.instant());
        } catch (IllegalStateException exception) {
            throw invalidLifecycle("Only a published resource can be withdrawn");
        }
        resourceRepository.flush();
        audit.succeeded(
                authorId,
                "RESOURCE_WITHDRAWN_BY_OWNER",
                "RESOURCE",
                resourceId,
                reason,
                requestId
        );
        return summary(resource);
    }

    @Transactional
    public MyResourceSummaryResponse restorePublication(
            UUID authorId,
            UUID resourceId,
            String reason,
            String requestId
    ) {
        KnowledgeResourceEntity resource = resourceRepository
                .findLockedByIdAndAuthorId(resourceId, authorId)
                .orElseThrow(this::notFound);
        try {
            resource.restore();
        } catch (IllegalStateException exception) {
            throw invalidLifecycle("Only a withdrawn resource can be restored");
        }
        resourceRepository.flush();
        audit.succeeded(
                authorId,
                "RESOURCE_RESTORED_BY_OWNER",
                "RESOURCE",
                resourceId,
                reason,
                requestId
        );
        return summary(resource);
    }

    private MyResourceSummaryResponse summary(KnowledgeResourceEntity resource) {
        KnowledgeDraftEntity draft = draftRepository.findById(resource.getId())
                .orElseThrow(this::notFound);
        Integer publicVersion = resource.getCurrentPublicVersionId() == null
                ? null
                : versionRepository.findById(resource.getCurrentPublicVersionId())
                        .map(KnowledgeVersionEntity::getVersionNumber)
                        .orElse(null);
        return new MyResourceSummaryResponse(
                resource.getId(),
                resource.getPublicSlug(),
                resource.getStatus(),
                draft.getResourceType(),
                draft.getTitle(),
                draft.getSummary(),
                draft.getVersion(),
                draft.getSavedAt(),
                resource.getPublishedAt(),
                publicVersion
        );
    }

    private ApiException invalidLifecycle(String title) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.RESOURCE_ALREADY_WITHDRAWN,
                title,
                false,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Resource was not found",
                false,
                Map.of()
        );
    }
}

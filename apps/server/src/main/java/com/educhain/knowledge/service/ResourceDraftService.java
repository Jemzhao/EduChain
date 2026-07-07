package com.educhain.knowledge.service;

import com.educhain.file.domain.UploadPurpose;
import com.educhain.file.service.FileBindingService;
import com.educhain.knowledge.dto.CreateResourceDraftRequest;
import com.educhain.knowledge.dto.DraftAttachmentRequest;
import com.educhain.knowledge.dto.ResourceDraftResponse;
import com.educhain.knowledge.dto.UpdateResourceDraftRequest;
import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import com.educhain.knowledge.entity.KnowledgeDraftTagEntity;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeDraftFileRepository;
import com.educhain.knowledge.repository.KnowledgeDraftRepository;
import com.educhain.knowledge.repository.KnowledgeDraftTagRepository;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import com.educhain.taxonomy.service.TaxonomyService;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceDraftService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeDraftRepository draftRepository;
    private final KnowledgeDraftTagRepository draftTagRepository;
    private final KnowledgeDraftFileRepository draftFileRepository;
    private final TaxonomyService taxonomyService;
    private final FileBindingService fileBindingService;
    private final ResourceResponseFactory responseFactory;
    private final ResourceSlugFactory slugFactory;
    private final IdempotencyService idempotencyService;
    private final EntityManager entityManager;
    private final Clock clock;

    public ResourceDraftService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeDraftRepository draftRepository,
            KnowledgeDraftTagRepository draftTagRepository,
            KnowledgeDraftFileRepository draftFileRepository,
            TaxonomyService taxonomyService,
            FileBindingService fileBindingService,
            ResourceResponseFactory responseFactory,
            ResourceSlugFactory slugFactory,
            IdempotencyService idempotencyService,
            EntityManager entityManager,
            Clock clock
    ) {
        this.resourceRepository = resourceRepository;
        this.draftRepository = draftRepository;
        this.draftTagRepository = draftTagRepository;
        this.draftFileRepository = draftFileRepository;
        this.taxonomyService = taxonomyService;
        this.fileBindingService = fileBindingService;
        this.responseFactory = responseFactory;
        this.slugFactory = slugFactory;
        this.idempotencyService = idempotencyService;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    @Transactional
    public ResourceDraftResponse create(
            UUID authorId,
            String idempotencyKey,
            CreateResourceDraftRequest request
    ) {
        String title = normalizeInline(request.title());
        String scope = "RESOURCE_DRAFT_CREATE:" + authorId;
        Optional<String> replay = idempotencyService.begin(
                scope,
                idempotencyKey,
                digest(title + ":" + request.resourceType().name())
        );
        if (replay.isPresent()) {
            return get(authorId, UUID.fromString(replay.orElseThrow()));
        }

        UUID resourceId = UUID.randomUUID();
        KnowledgeResourceEntity resource = resourceRepository.save(
                new KnowledgeResourceEntity(resourceId, slugFactory.draftSlug(resourceId), authorId)
        );
        KnowledgeDraftEntity draft = draftRepository.save(
                new KnowledgeDraftEntity(resourceId, title, request.resourceType(), clock.instant())
        );
        idempotencyService.complete(
                scope,
                idempotencyKey,
                authorId,
                resourceId.toString(),
                HttpStatus.CREATED.value()
        );
        entityManager.flush();
        return responseFactory.draft(resource, draft);
    }

    @Transactional(readOnly = true)
    public ResourceDraftResponse get(UUID authorId, UUID resourceId) {
        KnowledgeResourceEntity resource = requireOwned(authorId, resourceId);
        KnowledgeDraftEntity draft = draftRepository.findById(resourceId).orElseThrow(this::notFound);
        return responseFactory.draft(resource, draft);
    }

    @Transactional
    public ResourceDraftResponse update(
            UUID authorId,
            UUID resourceId,
            long expectedVersion,
            UpdateResourceDraftRequest request
    ) {
        KnowledgeResourceEntity resource = requireOwned(authorId, resourceId);
        if (resource.getStatus() == ResourceStatus.WITHDRAWN) {
            throw notEditable();
        }
        KnowledgeDraftEntity draft = draftRepository.findById(resourceId).orElseThrow(this::notFound);
        if (draft.getVersion() != expectedVersion) {
            throw versionConflict(draft.getVersion());
        }

        validateSelections(authorId, request);
        replaceTags(resourceId, request.tagIds());
        replaceFiles(resourceId, request.attachments());
        draft.update(
                normalizeInline(request.title()),
                normalizeInline(request.summary()),
                normalizeBody(request.body()),
                normalizeSourceUrl(request.sourceUrl()),
                request.categoryId(),
                request.coverFileId(),
                normalizeInline(request.copyrightStatement()),
                clock.instant()
        );
        entityManager.flush();
        return responseFactory.draft(resource, draft);
    }

    private void validateSelections(UUID authorId, UpdateResourceDraftRequest request) {
        normalizeSourceUrl(request.sourceUrl());
        if (request.categoryId() != null) {
            taxonomyService.requireCategory(request.categoryId());
        }
        requireUnique(request.tagIds(), "Tags must be unique");
        taxonomyService.requireTags(request.tagIds());
        if (request.coverFileId() != null) {
            fileBindingService.requireAvailable(
                    authorId,
                    request.coverFileId(),
                    Set.of(UploadPurpose.RESOURCE_COVER)
            );
        }
        List<UUID> attachmentIds = request.attachments().stream()
                .map(DraftAttachmentRequest::fileId)
                .toList();
        requireUnique(attachmentIds, "Attachments must be unique");
        requireStableOrder(request.attachments());
        fileBindingService.requireAvailable(
                authorId,
                attachmentIds,
                Set.of(UploadPurpose.RESOURCE_ATTACHMENT)
        );
    }

    private void replaceTags(UUID resourceId, List<UUID> tagIds) {
        draftTagRepository.deleteAllByResourceId(resourceId);
        draftTagRepository.flush();
        for (int index = 0; index < tagIds.size(); index++) {
            draftTagRepository.save(new KnowledgeDraftTagEntity(resourceId, tagIds.get(index), index));
        }
    }

    private void replaceFiles(UUID resourceId, List<DraftAttachmentRequest> attachments) {
        draftFileRepository.deleteAllByResourceId(resourceId);
        draftFileRepository.flush();
        for (DraftAttachmentRequest attachment : attachments) {
            draftFileRepository.save(new KnowledgeDraftFileEntity(
                    resourceId,
                    attachment.fileId(),
                    normalizeInline(attachment.displayName()),
                    attachment.purpose(),
                    attachment.order()
            ));
        }
    }

    private void requireStableOrder(List<DraftAttachmentRequest> attachments) {
        Set<Integer> order = new HashSet<>();
        attachments.forEach(attachment -> order.add(attachment.order()));
        for (int index = 0; index < attachments.size(); index++) {
            if (!order.contains(index)) {
                throw new IllegalArgumentException("Attachment order must be contiguous from zero.");
            }
        }
    }

    private <T> void requireUnique(List<T> values, String message) {
        if (new HashSet<>(values).size() != values.size()) {
            throw new IllegalArgumentException(message);
        }
    }

    private KnowledgeResourceEntity requireOwned(UUID authorId, UUID resourceId) {
        return resourceRepository.findByIdAndAuthorId(resourceId, authorId)
                .orElseThrow(this::notFound);
    }

    private String normalizeInline(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeBody(String value) {
        return value.replace("\r\n", "\n").replace('\r', '\n').strip();
    }

    private String normalizeSourceUrl(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            return "";
        }
        try {
            URI uri = URI.create(normalized);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw new IllegalArgumentException();
            }
            return uri.normalize().toString();
        } catch (IllegalArgumentException exception) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FIELD_VALIDATION_FAILED,
                    "Source URL must be a complete HTTPS URL",
                    false,
                    Map.of("sourceUrl", "FIELD_FORMAT_INVALID")
            );
        }
    }

    private String digest(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ApiException versionConflict(long currentVersion) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.VERSION_CONFLICT,
                "Draft version conflict",
                false,
                Map.of("currentVersion", Long.toString(currentVersion))
        );
    }

    private ApiException notEditable() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.DRAFT_NOT_EDITABLE,
                "Draft is not editable",
                false,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Resource draft was not found",
                false,
                Map.of()
        );
    }
}

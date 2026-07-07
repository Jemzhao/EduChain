package com.educhain.knowledge.service;

import com.educhain.knowledge.domain.ResourceType;

import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.service.ActivityService;
import com.educhain.file.domain.UploadPurpose;
import com.educhain.file.service.FileBindingService;
import com.educhain.file.service.FileSnapshot;
import com.educhain.job.entity.ReliableJobEntity;
import com.educhain.job.repository.ReliableJobRepository;
import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.knowledge.dto.PublicationProcessingResponse;
import com.educhain.knowledge.dto.PublicationResponse;
import com.educhain.knowledge.dto.ResourceDetailResponse;
import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.entity.KnowledgeVersionFileEntity;
import com.educhain.knowledge.entity.KnowledgeVersionTagEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeDraftFileRepository;
import com.educhain.knowledge.repository.KnowledgeDraftRepository;
import com.educhain.knowledge.repository.KnowledgeDraftTagRepository;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionFileRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.knowledge.repository.KnowledgeVersionTagRepository;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import com.educhain.social.service.SocialAudienceService;
import com.educhain.shared.api.BusinessMetrics;
import com.educhain.taxonomy.service.TaxonomyService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
public class ResourcePublicationService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeDraftRepository draftRepository;
    private final KnowledgeDraftTagRepository draftTagRepository;
    private final KnowledgeDraftFileRepository draftFileRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final KnowledgeVersionTagRepository versionTagRepository;
    private final KnowledgeVersionFileRepository versionFileRepository;
    private final TaxonomyService taxonomyService;
    private final FileBindingService fileBindingService;
    private final ReliableJobRepository jobRepository;
    private final IdempotencyService idempotencyService;
    private final CanonicalContentHasher contentHasher;
    private final ResourceSlugFactory slugFactory;
    private final ResourceResponseFactory responseFactory;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final BusinessMetrics metrics;
    private final ActivityService activityService;
    private final SocialAudienceService socialAudienceService;
    private final NotificationService notificationService;

    public ResourcePublicationService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeDraftRepository draftRepository,
            KnowledgeDraftTagRepository draftTagRepository,
            KnowledgeDraftFileRepository draftFileRepository,
            KnowledgeVersionRepository versionRepository,
            KnowledgeVersionTagRepository versionTagRepository,
            KnowledgeVersionFileRepository versionFileRepository,
            TaxonomyService taxonomyService,
            FileBindingService fileBindingService,
            ReliableJobRepository jobRepository,
            IdempotencyService idempotencyService,
            CanonicalContentHasher contentHasher,
            ResourceSlugFactory slugFactory,
            ResourceResponseFactory responseFactory,
            ObjectMapper objectMapper,
            Clock clock,
            BusinessMetrics metrics,
            ActivityService activityService,
            SocialAudienceService socialAudienceService,
            NotificationService notificationService
    ) {
        this.resourceRepository = resourceRepository;
        this.draftRepository = draftRepository;
        this.draftTagRepository = draftTagRepository;
        this.draftFileRepository = draftFileRepository;
        this.versionRepository = versionRepository;
        this.versionTagRepository = versionTagRepository;
        this.versionFileRepository = versionFileRepository;
        this.taxonomyService = taxonomyService;
        this.fileBindingService = fileBindingService;
        this.jobRepository = jobRepository;
        this.idempotencyService = idempotencyService;
        this.contentHasher = contentHasher;
        this.slugFactory = slugFactory;
        this.responseFactory = responseFactory;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.metrics = metrics;
        this.activityService = activityService;
        this.socialAudienceService = socialAudienceService;
        this.notificationService = notificationService;
    }

    @Transactional
    public PublicationResponse publish(
            UUID authorId,
            UUID resourceId,
            long expectedDraftVersion,
            String idempotencyKey
    ) {
        String scope = "RESOURCE_PUBLISH:" + resourceId;
        Optional<String> replay = idempotencyService.begin(
                scope,
                idempotencyKey,
                requestDigest(resourceId, expectedDraftVersion)
        );
        if (replay.isPresent()) {
            KnowledgeResourceEntity resource = requireOwnedLocked(authorId, resourceId);
            KnowledgeVersionEntity version = versionRepository
                    .findById(UUID.fromString(replay.orElseThrow()))
                    .orElseThrow(this::notFound);
            metrics.publication("replayed");
            return response(resource, version);
        }

        KnowledgeResourceEntity resource = requireOwnedLocked(authorId, resourceId);
        if (resource.getStatus() == ResourceStatus.WITHDRAWN) {
            throw notPublishable("Resource is withdrawn");
        }
        KnowledgeDraftEntity draft = draftRepository.findById(resourceId).orElseThrow(this::notFound);
        if (draft.getVersion() != expectedDraftVersion) {
            throw versionConflict(draft.getVersion());
        }
        validateDraft(draft);

        List<UUID> tagIds = draftTagRepository
                .findAllByResourceIdOrderBySortOrderAsc(resourceId)
                .stream()
                .map(tag -> tag.getTagId())
                .toList();
        taxonomyService.requireCategory(draft.getCategoryId());
        taxonomyService.requireTags(tagIds);

        FileSnapshot cover = draft.getCoverFileId() == null
                ? null
                : fileBindingService.requireAvailable(
                        authorId,
                        draft.getCoverFileId(),
                        Set.of(UploadPurpose.RESOURCE_COVER)
                );
        List<KnowledgeDraftFileEntity> draftFiles = draftFileRepository
                .findAllByResourceIdOrderBySortOrderAsc(resourceId);
        List<FileSnapshot> files = fileBindingService.requireAvailable(
                authorId,
                draftFiles.stream().map(KnowledgeDraftFileEntity::getFileId).toList(),
                Set.of(UploadPurpose.RESOURCE_ATTACHMENT)
        );
        Map<UUID, FileSnapshot> filesById = new HashMap<>();
        files.forEach(file -> filesById.put(file.id(), file));

        String digest = contentHasher.digest(
                resourceId,
                draft,
                tagIds,
                cover,
                draftFiles,
                filesById
        );
        versionRepository.findFirstByResourceIdOrderByVersionNumberDesc(resourceId)
                .filter(existing -> existing.getContentDigest().equals(digest))
                .ifPresent(existing -> {
                    throw notPublishable("Draft has no changes since the latest publication");
                });

        Instant now = clock.instant();
        UUID versionId = UUID.randomUUID();
        int versionNumber = Math.toIntExact(versionRepository.countByResourceId(resourceId) + 1);
        KnowledgeVersionEntity version = versionRepository.save(new KnowledgeVersionEntity(
                versionId,
                resourceId,
                versionNumber,
                draft.getTitle(),
                draft.getSummary(),
                draft.getBodyContent(),
                draft.getResourceType(),
                draft.getSourceUrl(),
                draft.getCategoryId(),
                draft.getCoverFileId(),
                draft.getCopyrightStatement(),
                authorId,
                digest,
                readingMinutes(draft.getBodyContent()),
                now
        ));
        for (int index = 0; index < tagIds.size(); index++) {
            versionTagRepository.save(new KnowledgeVersionTagEntity(versionId, tagIds.get(index), index));
        }
        for (KnowledgeDraftFileEntity draftFile : draftFiles) {
            versionFileRepository.save(new KnowledgeVersionFileEntity(
                    versionId,
                    draftFile.getFileId(),
                    draftFile.getDisplayName(),
                    draftFile.getPurpose(),
                    draftFile.getSortOrder(),
                    filesById.get(draftFile.getFileId()).sha256()
            ));
        }

        resource.publish(versionId, slugFactory.publishedSlug(draft.getTitle(), resourceId), now);
        activityService.record(authorId, ActivityType.PUBLISHED_RESOURCE, resourceId);
        socialAudienceService.followerIds(authorId).forEach(followerId ->
                notificationService.emit(new NotificationIntent(
                        followerId,
                        NotificationType.FOLLOWED_AUTHOR_PUBLISHED,
                        "followed-author-published:" + followerId + ":" + versionId,
                        authorId,
                        resourceId,
                        null
                ))
        );
        createDownstreamJobs(version, digest, now);
        idempotencyService.complete(
                scope,
                idempotencyKey,
                authorId,
                versionId.toString(),
                HttpStatus.CREATED.value()
        );
        versionRepository.flush();
        metrics.publication("succeeded");
        return response(resource, version);
    }

    private void validateDraft(KnowledgeDraftEntity draft) {
        Map<String, String> missing = new HashMap<>();
        if (draft.getTitle().length() < 3) missing.put("title", "FIELD_SIZE_INVALID");
        if (draft.getSummary().length() < 20) missing.put("summary", "FIELD_SIZE_INVALID");
        if ((draft.getResourceType() == com.educhain.knowledge.domain.ResourceType.ARTICLE
                || draft.getResourceType() == com.educhain.knowledge.domain.ResourceType.DOCUMENT)
                && draft.getBodyContent().length() < 100) {
            missing.put("body", "FIELD_SIZE_INVALID");
        }
        if ((draft.getResourceType() == com.educhain.knowledge.domain.ResourceType.VIDEO
                || draft.getResourceType() == com.educhain.knowledge.domain.ResourceType.LINK)
                && draft.getSourceUrl().isBlank()) {
            missing.put("sourceUrl", "FIELD_REQUIRED");
        }
        if (draft.getCategoryId() == null) missing.put("categoryId", "FIELD_REQUIRED");
        if (draft.getCopyrightStatement().isBlank()) {
            missing.put("copyrightStatement", "FIELD_REQUIRED");
        }
        if (!missing.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.RESOURCE_NOT_PUBLISHABLE,
                    "Resource does not satisfy publication requirements",
                    false,
                    missing
            );
        }
    }

    private void createDownstreamJobs(KnowledgeVersionEntity version, String digest, Instant now) {
        String payload = objectMapper.writeValueAsString(Map.of(
                "resourceId", version.getResourceId().toString(),
                "versionId", version.getId().toString(),
                "contentDigest", digest
        ));
        jobRepository.save(new ReliableJobEntity(
                "SEARCH_INDEX_RESOURCE",
                version.getId().toString(),
                payload,
                now
        ));
        jobRepository.save(new ReliableJobEntity(
                "EVIDENCE_SUBMIT_VERSION",
                version.getId().toString(),
                payload,
                now
        ));
    }

    private PublicationResponse response(
            KnowledgeResourceEntity resource,
            KnowledgeVersionEntity version
    ) {
        ResourceDetailResponse detail = responseFactory.detail(resource, version);
        return new PublicationResponse(
                detail,
                new PublicationProcessingResponse(
                        PublicationProcessingResponse.SearchProcessingStatus.PENDING,
                        EvidenceProcessingStatus.PENDING
                )
        );
    }

    private int readingMinutes(String body) {
        long nonWhitespace = body.codePoints().filter(codePoint -> !Character.isWhitespace(codePoint)).count();
        return Math.max(1, (int) Math.ceil(nonWhitespace / 500.0));
    }

    private KnowledgeResourceEntity requireOwnedLocked(UUID authorId, UUID resourceId) {
        return resourceRepository.findLockedByIdAndAuthorId(resourceId, authorId)
                .orElseThrow(this::notFound);
    }

    private String requestDigest(UUID resourceId, long draftVersion) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String value = resourceId + ":" + draftVersion;
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ApiException notPublishable(String title) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.RESOURCE_NOT_PUBLISHABLE,
                title,
                false,
                Map.of()
        );
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

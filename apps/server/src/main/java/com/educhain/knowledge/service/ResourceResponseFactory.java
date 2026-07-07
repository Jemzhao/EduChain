package com.educhain.knowledge.service;

import com.educhain.file.service.FileBindingService;
import com.educhain.file.service.FileSnapshot;
import com.educhain.platform.port.EvidenceStatusPort;
import com.educhain.knowledge.dto.DraftAttachmentResponse;
import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.knowledge.dto.PublishedAttachmentResponse;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.dto.ResourceCardResponse;
import com.educhain.knowledge.dto.ResourceDetailResponse;
import com.educhain.knowledge.dto.ResourceDraftResponse;
import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.entity.KnowledgeVersionFileEntity;
import com.educhain.knowledge.entity.KnowledgeVersionTagEntity;
import com.educhain.knowledge.repository.KnowledgeDraftFileRepository;
import com.educhain.knowledge.repository.KnowledgeDraftTagRepository;
import com.educhain.knowledge.repository.KnowledgeVersionFileRepository;
import com.educhain.knowledge.repository.KnowledgeVersionTagRepository;
import com.educhain.taxonomy.dto.CategoryResponse;
import com.educhain.taxonomy.dto.TagResponse;
import com.educhain.taxonomy.service.TaxonomyService;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ResourceResponseFactory {

    private final KnowledgeDraftTagRepository draftTagRepository;
    private final KnowledgeDraftFileRepository draftFileRepository;
    private final KnowledgeVersionTagRepository versionTagRepository;
    private final KnowledgeVersionFileRepository versionFileRepository;
    private final TaxonomyService taxonomyService;
    private final FileBindingService fileBindingService;
    private final UserService userService;
    private final EvidenceStatusPort evidenceStatusReadService;

    public ResourceResponseFactory(
            KnowledgeDraftTagRepository draftTagRepository,
            KnowledgeDraftFileRepository draftFileRepository,
            KnowledgeVersionTagRepository versionTagRepository,
            KnowledgeVersionFileRepository versionFileRepository,
            TaxonomyService taxonomyService,
            FileBindingService fileBindingService,
            UserService userService,
            EvidenceStatusPort evidenceStatusReadService
    ) {
        this.draftTagRepository = draftTagRepository;
        this.draftFileRepository = draftFileRepository;
        this.versionTagRepository = versionTagRepository;
        this.versionFileRepository = versionFileRepository;
        this.taxonomyService = taxonomyService;
        this.fileBindingService = fileBindingService;
        this.userService = userService;
        this.evidenceStatusReadService = evidenceStatusReadService;
    }

    public ResourceDraftResponse draft(
            KnowledgeResourceEntity resource,
            KnowledgeDraftEntity draft
    ) {
        List<UUID> tagIds = draftTagRepository
                .findAllByResourceIdOrderBySortOrderAsc(resource.getId())
                .stream()
                .map(tag -> tag.getTagId())
                .toList();
        List<DraftAttachmentResponse> attachments = draftFileRepository
                .findAllByResourceIdOrderBySortOrderAsc(resource.getId())
                .stream()
                .map(file -> new DraftAttachmentResponse(
                        file.getFileId(),
                        file.getDisplayName(),
                        file.getPurpose(),
                        file.getSortOrder()
                ))
                .toList();
        return new ResourceDraftResponse(
                resource.getId(),
                resource.getPublicSlug(),
                resource.getStatus(),
                resource.getVersion(),
                draft.getVersion(),
                draft.getTitle(),
                draft.getSummary(),
                draft.getBodyContent(),
                draft.getResourceType(),
                draft.getSourceUrl(),
                draft.getCategoryId(),
                tagIds,
                draft.getCoverFileId(),
                attachments,
                draft.getCopyrightStatement(),
                draft.getSavedAt()
        );
    }

    public ResourceCardResponse card(
            KnowledgeResourceEntity resource,
            KnowledgeVersionEntity version
    ) {
        return card(resource, version, evidenceStatusReadService.status(version.getId()));
    }

    public ResourceCardResponse card(
            KnowledgeResourceEntity resource,
            KnowledgeVersionEntity version,
            EvidenceProcessingStatus evidenceStatus
    ) {
        CategoryResponse category = taxonomyService.requireCategory(version.getCategoryId());
        List<TagResponse> tags = taxonomyService.requireTags(versionTagRepository
                .findAllByVersionIdOrderBySortOrderAsc(version.getId())
                .stream()
                .map(tag -> tag.getTagId())
                .toList());
        PublicAuthorSnapshot author = userService.getPublicAuthor(resource.getAuthorId());
        return resolvedCard(resource, version, category, tags, author, evidenceStatus);
    }

    public List<ResourceCardResponse> cards(List<ResourceCardSource> sources) {
        if (sources.isEmpty()) {
            return List.of();
        }
        List<UUID> versionIds = sources.stream()
                .map(source -> source.version().getId())
                .toList();
        Map<UUID, List<KnowledgeVersionTagEntity>> tagLinks = new HashMap<>();
        versionTagRepository.findAllByVersionIdIn(versionIds).stream()
                .sorted(Comparator.comparingInt(KnowledgeVersionTagEntity::getSortOrder))
                .forEach(link -> tagLinks.computeIfAbsent(
                        link.getVersionId(),
                        ignored -> new ArrayList<>()
                ).add(link));
        Collection<UUID> tagIds = tagLinks.values().stream()
                .flatMap(Collection::stream)
                .map(KnowledgeVersionTagEntity::getTagId)
                .distinct()
                .toList();
        Map<UUID, TagResponse> tags = taxonomyService.requireTagMap(tagIds);
        Map<UUID, CategoryResponse> categories = taxonomyService.requireCategories(
                sources.stream()
                        .map(source -> source.version().getCategoryId())
                        .distinct()
                        .toList()
        );
        Map<UUID, PublicAuthorSnapshot> authors = userService.getPublicAuthors(
                sources.stream()
                        .map(source -> source.resource().getAuthorId())
                        .distinct()
                        .toList()
        );
        Map<UUID, EvidenceProcessingStatus> evidenceStatuses = evidenceStatusReadService.statuses(
                versionIds
        );
        return sources.stream()
                .map(source -> resolvedCard(
                        source.resource(),
                        source.version(),
                        categories.get(source.version().getCategoryId()),
                        tagLinks.getOrDefault(source.version().getId(), List.of()).stream()
                                .map(link -> tags.get(link.getTagId()))
                                .toList(),
                        authors.get(source.resource().getAuthorId()),
                        evidenceStatuses.get(source.version().getId())
                ))
                .toList();
    }

    private ResourceCardResponse resolvedCard(
            KnowledgeResourceEntity resource,
            KnowledgeVersionEntity version,
            CategoryResponse category,
            List<TagResponse> tags,
            PublicAuthorSnapshot author,
            EvidenceProcessingStatus evidenceStatus
    ) {
        return new ResourceCardResponse(
                resource.getId(),
                resource.getPublicSlug(),
                version.getTitle(),
                version.getSummary(),
                version.getResourceType(),
                new ResourceAuthorResponse(
                        author.id(),
                        author.handle(),
                        author.displayName(),
                        author.avatarUrl()
                ),
                category,
                tags,
                version.getPublishedAt(),
                version.getReadingMinutes(),
                evidenceStatus
        );
    }

    public ResourceDetailResponse detail(
            KnowledgeResourceEntity resource,
            KnowledgeVersionEntity version
    ) {
        ResourceCardResponse card = card(resource, version);
        List<KnowledgeVersionFileEntity> versionFiles = versionFileRepository
                .findAllByVersionIdOrderBySortOrderAsc(version.getId());
        List<FileSnapshot> files = fileBindingService.readPublishedMetadata(versionFiles.stream()
                .map(KnowledgeVersionFileEntity::getFileId)
                .toList());
        Map<UUID, FileSnapshot> filesById = new HashMap<>();
        files.forEach(file -> filesById.put(file.id(), file));
        List<PublishedAttachmentResponse> attachments = versionFiles.stream()
                .map(versionFile -> {
                    FileSnapshot file = filesById.get(versionFile.getFileId());
                    return new PublishedAttachmentResponse(
                            file.id(),
                            versionFile.getDisplayName(),
                            file.mediaType(),
                            file.size(),
                            versionFile.getSha256AtPublication()
                    );
                })
                .toList();
        return new ResourceDetailResponse(
                card.id(),
                card.slug(),
                card.title(),
                card.summary(),
                card.resourceType(),
                card.author(),
                card.category(),
                card.tags(),
                card.publishedAt(),
                card.readingMinutes(),
                card.evidenceStatus(),
                version.getId(),
                version.getVersionNumber(),
                version.getBodyContent(),
                version.getSourceUrl(),
                version.getCopyrightStatement(),
                attachments,
                version.getContentDigest()
        );
    }
}

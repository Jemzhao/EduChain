package com.educhain.knowledge.service;

import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceCardResponse;
import com.educhain.knowledge.dto.ResourceDetailResponse;
import com.educhain.knowledge.dto.ResourceListResponse;
import com.educhain.knowledge.dto.ResourceSort;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceQueryService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final ResourceResponseFactory responseFactory;

    public ResourceQueryService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeVersionRepository versionRepository,
            ResourceResponseFactory responseFactory
    ) {
        this.resourceRepository = resourceRepository;
        this.versionRepository = versionRepository;
        this.responseFactory = responseFactory;
    }

    @Transactional(readOnly = true)
    public ResourceDetailResponse get(String resourceKey) {
        KnowledgeResourceEntity resource = findResource(resourceKey);
        if (resource.getStatus() == ResourceStatus.WITHDRAWN) {
            throw new ApiException(
                    HttpStatus.GONE,
                    ErrorCode.RESOURCE_ALREADY_WITHDRAWN,
                    "Resource has been withdrawn",
                    false,
                    Map.of("resourceId", resource.getId().toString())
            );
        }
        if (resource.getStatus() != ResourceStatus.PUBLISHED
                || resource.getCurrentPublicVersionId() == null) {
            throw notFound();
        }
        KnowledgeVersionEntity version = versionRepository
                .findById(resource.getCurrentPublicVersionId())
                .orElseThrow(this::notFound);
        return responseFactory.detail(resource, version);
    }

    @Transactional(readOnly = true)
    public ResourceListResponse list(
            String cursor,
            int limit,
            String category,
            String tag,
            ResourceSort sort
    ) {
        int pageIndex = decodeCursor(cursor);
        Page<KnowledgeResourceEntity> page = resourceRepository.findAllByStatus(
                ResourceStatus.PUBLISHED,
                PageRequest.of(
                        pageIndex,
                        Math.min(limit * 3, 50),
                        sortFor(sort)
                )
        );
        List<ResourceCardResponse> items = new ArrayList<>();
        List<UUID> versionIds = page.getContent().stream()
                .map(KnowledgeResourceEntity::getCurrentPublicVersionId)
                .filter(java.util.Objects::nonNull)
                .toList();
        Map<UUID, KnowledgeVersionEntity> versions = new HashMap<>();
        versionRepository.findAllById(versionIds)
                .forEach(version -> versions.put(version.getId(), version));
        List<ResourceCardSource> sources = page.getContent().stream()
                .filter(resource -> resource.getCurrentPublicVersionId() != null)
                .map(resource -> new ResourceCardSource(
                        resource,
                        versions.get(resource.getCurrentPublicVersionId())
                ))
                .toList();
        if (sources.stream().anyMatch(source -> source.version() == null)) {
            throw notFound();
        }
        for (ResourceCardResponse card : responseFactory.cards(sources)) {
            if (!matches(card, category, tag)) continue;
            items.add(card);
            if (items.size() == limit) break;
        }
        boolean hasMore = page.hasNext() || items.size() == limit;
        String nextCursor = hasMore ? encodeCursor(pageIndex + 1) : null;
        return new ResourceListResponse(items, new PageInfoResponse(nextCursor, hasMore));
    }

    private Sort sortFor(ResourceSort sort) {
        return switch (sort) {
            case RELEVANCE, NEWEST, QUALITY, POPULAR -> Sort.by(
                    Sort.Order.desc("publishedAt"),
                    Sort.Order.desc("id")
            );
        };
    }

    private boolean matches(ResourceCardResponse card, String category, String tag) {
        boolean categoryMatches = category == null
                || category.isBlank()
                || card.category().slug().equals(category);
        boolean tagMatches = tag == null
                || tag.isBlank()
                || card.tags().stream().anyMatch(item -> item.slug().equals(tag));
        return categoryMatches && tagMatches;
    }

    private KnowledgeResourceEntity findResource(String key) {
        try {
            return resourceRepository.findById(UUID.fromString(key)).orElseThrow(this::notFound);
        } catch (IllegalArgumentException ignored) {
            return resourceRepository.findByPublicSlug(key).orElseThrow(this::notFound);
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            if (!decoded.startsWith("page:")) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(5));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("page:" + page).getBytes(StandardCharsets.UTF_8));
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

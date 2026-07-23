package com.educhain.externalcontent.service;

import com.educhain.externalcontent.dto.ExternalContentModels;
import com.educhain.externalcontent.entity.ExternalContentItemEntity;
import com.educhain.externalcontent.entity.ExternalContentSourceEntity;
import com.educhain.externalcontent.domain.ExternalQualityStatus;
import com.educhain.externalcontent.repository.ExternalContentItemRepository;
import com.educhain.externalcontent.repository.ExternalContentSourceRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExternalContentService {
    private final ExternalContentSourceRepository sources;
    private final ExternalContentItemRepository items;
    private final ExternalUriPolicy uriPolicy;
    private final Clock clock;

    public ExternalContentService(
            ExternalContentSourceRepository sources,
            ExternalContentItemRepository items,
            ExternalUriPolicy uriPolicy,
            Clock clock
    ) {
        this.sources = sources;
        this.items = items;
        this.uriPolicy = uriPolicy;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ExternalContentModels.ItemListResponse publicItems(String query, int limit) {
        String normalized = query == null ? "" : query.trim();
        return new ExternalContentModels.ItemListResponse(items
                .searchPublic(normalized, PageRequest.of(0, limit))
                .map(this::itemResponse)
                .getContent());
    }

    @Transactional(readOnly = true)
    public ExternalContentModels.SourceListResponse sources() {
        return new ExternalContentModels.SourceListResponse(sources
                .findAllByOrderByNameAsc()
                .stream()
                .map(this::sourceResponse)
                .toList());
    }

    @Transactional(readOnly = true)
    public ExternalContentModels.ItemListResponse reviewQueue(
            ExternalQualityStatus status,
            int limit
    ) {
        var page = status == null
                ? items.findAllByOrderByFetchedAtDesc(PageRequest.of(0, limit))
                : items.findAllByQualityStatusOrderByFetchedAtDesc(
                        status,
                        PageRequest.of(0, limit)
                );
        return new ExternalContentModels.ItemListResponse(page.map(this::itemResponse).getContent());
    }

    @Transactional
    public ExternalContentModels.SourceResponse create(ExternalContentModels.SourceWriteRequest request) {
        String siteUrl = uriPolicy.configurationUri(request.siteUrl()).toString();
        String feedUrl = uriPolicy.configurationUri(request.feedUrl()).toString();
        ExternalContentSourceEntity source = new ExternalContentSourceEntity(
                UUID.randomUUID(),
                request.name().trim(),
                siteUrl,
                feedUrl
        );
        source.update(request.name().trim(), siteUrl, feedUrl, request.enabled());
        return sourceResponse(sources.saveAndFlush(source));
    }

    @Transactional
    public ExternalContentModels.SourceResponse update(
            UUID sourceId,
            long expectedVersion,
            ExternalContentModels.SourceWriteRequest request
    ) {
        ExternalContentSourceEntity source = requireSource(sourceId);
        requireVersion(source.getVersion(), expectedVersion);
        source.update(
                request.name().trim(),
                uriPolicy.configurationUri(request.siteUrl()).toString(),
                uriPolicy.configurationUri(request.feedUrl()).toString(),
                request.enabled()
        );
        sources.flush();
        return sourceResponse(source);
    }

    @Transactional
    public ExternalContentModels.ItemResponse review(
            UUID itemId,
            long expectedVersion,
            ExternalQualityStatus status
    ) {
        ExternalContentItemEntity item = items.findById(itemId).orElseThrow(this::itemNotFound);
        requireVersion(item.getVersion(), expectedVersion);
        item.review(status);
        items.flush();
        return itemResponse(item);
    }

    @Transactional
    public ExternalContentModels.SourceSnapshot beginSync(UUID sourceId) {
        ExternalContentSourceEntity source = requireSource(sourceId);
        if (!source.isEnabled()) throw sourceDisabled();
        source.beginSync();
        sources.flush();
        return new ExternalContentModels.SourceSnapshot(
                source.getId(),
                source.getSiteUrl(),
                source.getFeedUrl()
        );
    }

    @Transactional
    public ExternalContentModels.PersistedSync completeSync(
            UUID sourceId,
            java.util.List<ExternalContentModels.NormalizedFeedItem> feedItems
    ) {
        ExternalContentSourceEntity source = requireSource(sourceId);
        Instant fetchedAt = clock.instant();
        int inserted = 0;
        int updated = 0;
        int duplicates = 0;
        var seen = new HashSet<String>();
        for (ExternalContentModels.NormalizedFeedItem feedItem : feedItems) {
            if (!seen.add(feedItem.urlDigest())) {
                duplicates++;
                continue;
            }
            var existing = items.findByUrlDigest(feedItem.urlDigest());
            if (existing.isPresent()) {
                ExternalContentItemEntity item = existing.orElseThrow();
                if (!item.getSource().getId().equals(sourceId)) {
                    duplicates++;
                    continue;
                }
                item.refresh(
                        feedItem.externalKey(),
                        feedItem.canonicalUrl(),
                        feedItem.title(),
                        feedItem.summary(),
                        feedItem.authorName(),
                        feedItem.publishedAt(),
                        fetchedAt
                );
                updated++;
            } else {
                items.save(new ExternalContentItemEntity(
                        UUID.randomUUID(),
                        source,
                        feedItem.externalKey(),
                        feedItem.canonicalUrl(),
                        feedItem.urlDigest(),
                        feedItem.title(),
                        feedItem.summary(),
                        feedItem.authorName(),
                        feedItem.publishedAt(),
                        fetchedAt
                ));
                inserted++;
            }
        }
        source.completeSync(fetchedAt);
        items.flush();
        sources.flush();
        return new ExternalContentModels.PersistedSync(
                sourceResponse(source),
                inserted,
                updated,
                duplicates
        );
    }

    @Transactional
    public void failSync(UUID sourceId, String errorCode) {
        ExternalContentSourceEntity source = requireSource(sourceId);
        source.failSync(errorCode, clock.instant());
        sources.flush();
    }

    public ExternalContentModels.SourceResponse sourceResponse(ExternalContentSourceEntity source) {
        return new ExternalContentModels.SourceResponse(
                source.getId(),
                source.getName(),
                source.getSiteUrl(),
                source.getFeedUrl(),
                source.isEnabled(),
                source.getSyncStatus(),
                source.getLastSyncError(),
                source.getLastSyncedAt(),
                source.getVersion(),
                source.getCreatedAt(),
                source.getUpdatedAt()
        );
    }

    private ExternalContentModels.ItemResponse itemResponse(ExternalContentItemEntity item) {
        return new ExternalContentModels.ItemResponse(
                item.getId(),
                item.getSource().getId(),
                item.getSource().getName(),
                item.getSource().getSiteUrl(),
                item.getCanonicalUrl(),
                item.getTitle(),
                item.getSummary(),
                item.getAuthorName(),
                item.getQualityStatus(),
                item.getPublishedAt(),
                item.getFetchedAt(),
                item.getVersion()
        );
    }

    private ExternalContentSourceEntity requireSource(UUID sourceId) {
        return sources.findById(sourceId).orElseThrow(this::sourceNotFound);
    }

    private void requireVersion(long current, long expected) {
        if (current != expected) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "External content version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(current))
            );
        }
    }

    private ApiException sourceNotFound() {
        return error(HttpStatus.NOT_FOUND, ErrorCode.EXTERNAL_SOURCE_NOT_FOUND, false);
    }

    private ApiException itemNotFound() {
        return error(HttpStatus.NOT_FOUND, ErrorCode.EXTERNAL_ITEM_NOT_FOUND, false);
    }

    private ApiException sourceDisabled() {
        return error(HttpStatus.CONFLICT, ErrorCode.EXTERNAL_SOURCE_DISABLED, false);
    }

    private ApiException error(HttpStatus status, ErrorCode code, boolean retryable) {
        return new ApiException(status, code, code.name(), retryable, Map.of());
    }
}

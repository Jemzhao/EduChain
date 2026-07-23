package com.educhain.externalcontent.dto;

import com.educhain.externalcontent.domain.ExternalQualityStatus;
import com.educhain.externalcontent.domain.ExternalSyncStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ExternalContentModels {
    private ExternalContentModels() {
    }

    public record SourceWriteRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 2048) String siteUrl,
            @NotBlank @Size(max = 2048) String feedUrl,
            boolean enabled,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record SourceResponse(
            UUID id,
            String name,
            String siteUrl,
            String feedUrl,
            boolean enabled,
            ExternalSyncStatus syncStatus,
            String lastSyncError,
            Instant lastSyncedAt,
            long version,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record SourceListResponse(List<SourceResponse> items) {
        public SourceListResponse { items = List.copyOf(items); }
    }

    public record ItemResponse(
            UUID id,
            UUID sourceId,
            String sourceName,
            String sourceSiteUrl,
            String canonicalUrl,
            String title,
            String summary,
            String authorName,
            ExternalQualityStatus qualityStatus,
            Instant publishedAt,
            Instant fetchedAt,
            long version
    ) {
    }

    public record ItemListResponse(List<ItemResponse> items) {
        public ItemListResponse { items = List.copyOf(items); }
    }

    public record ReviewRequest(
            @NotNull ExternalQualityStatus status,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record SyncRequest(@NotBlank @Size(min = 10, max = 500) String reason) {
    }

    public record SyncResponse(
            SourceResponse source,
            int fetched,
            int inserted,
            int updated,
            int duplicates
    ) {
    }

    public record FeedEnvelope(List<FeedItem> items) {
    }

    public record FeedItem(
            String id,
            String title,
            String summary,
            String url,
            String author,
            Instant publishedAt
    ) {
    }

    public record SourceSnapshot(UUID id, String siteUrl, String feedUrl) {
    }

    public record NormalizedFeedItem(
            String externalKey,
            String canonicalUrl,
            String urlDigest,
            String title,
            String summary,
            String authorName,
            Instant publishedAt
    ) {
    }

    public record PersistedSync(SourceResponse source, int inserted, int updated, int duplicates) {
    }
}

package com.educhain.externalcontent.service;

import com.educhain.externalcontent.dto.ExternalContentModels;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class ExternalContentSyncService {
    private static final int MAX_RESPONSE_BYTES = 1_048_576;
    private static final int MAX_ITEMS = 100;

    private final ExternalContentService content;
    private final ExternalUriPolicy uriPolicy;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ExternalContentSyncService(
            ExternalContentService content,
            ExternalUriPolicy uriPolicy,
            @Qualifier("externalContentHttpClient") HttpClient httpClient,
            ObjectMapper objectMapper
    ) {
        this.content = content;
        this.uriPolicy = uriPolicy;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public ExternalContentModels.SyncResponse sync(UUID sourceId) {
        ExternalContentModels.SourceSnapshot source = content.beginSync(sourceId);
        try {
            List<ExternalContentModels.NormalizedFeedItem> feed = fetch(source);
            ExternalContentModels.PersistedSync persisted = content.completeSync(sourceId, feed);
            return new ExternalContentModels.SyncResponse(
                    persisted.source(),
                    feed.size(),
                    persisted.inserted(),
                    persisted.updated(),
                    persisted.duplicates()
            );
        } catch (ApiException exception) {
            content.failSync(sourceId, exception.code().name());
            throw exception;
        } catch (RuntimeException exception) {
            content.failSync(sourceId, ErrorCode.SERVICE_UNAVAILABLE.name());
            throw unavailable();
        }
    }

    private List<ExternalContentModels.NormalizedFeedItem> fetch(
            ExternalContentModels.SourceSnapshot source
    ) {
        URI feedUri = uriPolicy.fetchUri(source.feedUrl());
        String allowedItemHost = uriPolicy.configurationUri(source.siteUrl()).getHost();
        HttpRequest request = HttpRequest.newBuilder(feedUri)
                .timeout(Duration.ofSeconds(8))
                .header("Accept", "application/json, application/*+json")
                .header("User-Agent", "EduChain-External-Content/1.0")
                .GET()
                .build();
        try {
            HttpResponse<InputStream> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofInputStream()
            );
            if (response.statusCode() != 200 || !isJson(response)) throw unavailable();
            byte[] payload;
            try (InputStream input = response.body()) {
                payload = input.readNBytes(MAX_RESPONSE_BYTES + 1);
            }
            if (payload.length > MAX_RESPONSE_BYTES) throw uriPolicy.feedInvalid();
            ExternalContentModels.FeedEnvelope envelope = objectMapper.readValue(
                    new String(payload, StandardCharsets.UTF_8),
                    ExternalContentModels.FeedEnvelope.class
            );
            if (envelope.items() == null || envelope.items().size() > MAX_ITEMS) {
                throw uriPolicy.feedInvalid();
            }
            List<ExternalContentModels.NormalizedFeedItem> normalized = new ArrayList<>();
            for (ExternalContentModels.FeedItem item : envelope.items()) {
                normalized.add(normalize(item, allowedItemHost));
            }
            return List.copyOf(normalized);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable();
        } catch (IOException exception) {
            throw unavailable();
        }
    }

    private ExternalContentModels.NormalizedFeedItem normalize(
            ExternalContentModels.FeedItem item,
            String allowedItemHost
    ) {
        if (item == null
                || blank(item.title())
                || item.title().trim().length() > 240
                || blank(item.summary())
                || item.summary().trim().length() > 4000
                || blank(item.url())
                || blank(item.author())
                || item.author().trim().length() > 160) {
            throw uriPolicy.feedInvalid();
        }
        URI canonical = uriPolicy.itemUri(item.url(), allowedItemHost);
        String digest = digest(canonical.toString());
        String externalKey = blank(item.id()) ? digest : item.id().trim();
        if (externalKey.length() > 200) throw uriPolicy.feedInvalid();
        return new ExternalContentModels.NormalizedFeedItem(
                externalKey,
                canonical.toString(),
                digest,
                item.title().trim(),
                item.summary().trim(),
                item.author().trim(),
                item.publishedAt()
        );
    }

    private boolean isJson(HttpResponse<?> response) {
        String value = response.headers().firstValue("Content-Type").orElse("");
        String mediaType = value.split(";", 2)[0].trim().toLowerCase();
        return mediaType.equals("application/json") || mediaType.endsWith("+json");
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ApiException unavailable() {
        return new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.SERVICE_UNAVAILABLE,
                "External content source is unavailable",
                true,
                Map.of()
        );
    }
}

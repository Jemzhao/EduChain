package com.educhain.search.service;

import com.educhain.interaction.service.InteractionSignalReadService;
import com.educhain.interaction.service.InteractionSignals;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceCardResponse;
import com.educhain.knowledge.dto.ResourceSort;
import com.educhain.knowledge.service.KnowledgeSearchReadService;
import com.educhain.knowledge.service.SearchableResourceSnapshot;
import com.educhain.search.dto.MatchedField;
import com.educhain.search.dto.PopularSearchKeywordListResponse;
import com.educhain.search.dto.PopularSearchKeywordResponse;
import com.educhain.search.dto.RankingSignal;
import com.educhain.search.dto.SearchHighlightResponse;
import com.educhain.search.dto.SearchResourceItemResponse;
import com.educhain.search.dto.SearchResourceResponse;
import com.educhain.search.dto.SearchSuggestionResponse;
import com.educhain.search.dto.SearchHistoryItemResponse;
import com.educhain.search.dto.SearchHistoryResponse;
import com.educhain.search.entity.SearchEventEntity;
import com.educhain.search.repository.SearchEventRepository;
import com.educhain.search.repository.SearchHistoryRepository;
import com.educhain.taxonomy.service.TaxonomyService;
import com.educhain.shared.api.BusinessMetrics;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
public class SearchService {

    private static final int CANDIDATE_LIMIT = 500;
    private static final Duration EVENT_RETENTION = Duration.ofDays(90);

    private final KnowledgeSearchReadService knowledgeSearchReadService;
    private final TaxonomyService taxonomyService;
    private final SearchEventRepository eventRepository;
    private final SearchHistoryRepository historyRepository;
    private final InteractionSignalReadService interactionSignalReadService;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final BusinessMetrics metrics;

    public SearchService(
            KnowledgeSearchReadService knowledgeSearchReadService,
            TaxonomyService taxonomyService,
            SearchEventRepository eventRepository,
            SearchHistoryRepository historyRepository,
            InteractionSignalReadService interactionSignalReadService,
            ObjectMapper objectMapper,
            Clock clock,
            BusinessMetrics metrics
    ) {
        this.knowledgeSearchReadService = knowledgeSearchReadService;
        this.taxonomyService = taxonomyService;
        this.eventRepository = eventRepository;
        this.historyRepository = historyRepository;
        this.interactionSignalReadService = interactionSignalReadService;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.metrics = metrics;
    }

    @Transactional
    public SearchResourceResponse search(
            UUID userId,
            String query,
            String category,
            List<String> tags,
            String author,
            ResourceSort sort,
            String cursor,
            int limit
    ) {
        String normalizedQuery = normalize(query);
        String normalizedCategory = normalize(category);
        String normalizedAuthor = normalize(author);
        List<String> normalizedTags = normalizeTags(tags);
        String signature = signature(
                normalizedQuery,
                normalizedCategory,
                normalizedTags,
                normalizedAuthor,
                sort
        );
        SearchCursor searchCursor = decodeCursor(cursor, signature);

        List<SearchableResourceSnapshot> candidates = knowledgeSearchReadService
                .candidates(CANDIDATE_LIMIT);
        Map<UUID, InteractionSignals> interactionSignals = interactionSignalReadService.signalsFor(
                candidates.stream().map(candidate -> candidate.card().id()).toList()
        );
        List<ScoredResource> matches = new ArrayList<>();
        for (SearchableResourceSnapshot candidate : candidates) {
            ScoredResource scored = score(
                    candidate,
                    normalizedQuery,
                    interactionSignals.getOrDefault(
                            candidate.card().id(),
                            new InteractionSignals(0, 0, 0)
                    )
            );
            if (!matchesFilters(scored, normalizedCategory, normalizedTags, normalizedAuthor)) {
                continue;
            }
            if (!normalizedQuery.isBlank() && scored.matchedFields().isEmpty()) {
                continue;
            }
            matches.add(scored);
        }
        matches.sort(comparator(sort));

        int from = Math.min(searchCursor.offset(), matches.size());
        int to = Math.min(from + limit, matches.size());
        List<SearchResourceItemResponse> items = matches.subList(from, to).stream()
                .map(ScoredResource::response)
                .toList();
        boolean hasMore = to < matches.size();
        String nextCursor = hasMore
                ? encodeCursor(searchCursor.queryId(), to, signature)
                : null;
        if (searchCursor.offset() == 0) {
            recordEvent(
                    searchCursor.queryId(),
                    normalizedQuery,
                    normalizedCategory,
                    normalizedTags,
                    normalizedAuthor,
                    sort,
                    matches.size()
            );
            recordHistory(userId, normalizedQuery, matches.size());
        }
        metrics.search(matches.isEmpty());
        return new SearchResourceResponse(
                searchCursor.queryId(),
                normalizedQuery,
                items,
                new PageInfoResponse(nextCursor, hasMore)
        );
    }

    @Transactional(readOnly = true)
    public SearchSuggestionResponse suggestions(String query) {
        String normalized = normalize(query);
        LinkedHashSet<String> suggestions = new LinkedHashSet<>();
        taxonomyService.tags(normalized, 8).items().forEach(tag -> suggestions.add(tag.name()));
        knowledgeSearchReadService.candidates(100).forEach(candidate -> {
            if (normalize(candidate.card().title()).contains(normalized) && suggestions.size() < 8) {
                suggestions.add(candidate.card().title());
            }
        });
        return new SearchSuggestionResponse(suggestions.stream().limit(8).toList());
    }

    @Transactional(readOnly = true)
    public SearchHistoryResponse history(UUID userId, int limit) {
        return new SearchHistoryResponse(historyRepository
                .findAllByUserIdOrderBySearchedAtDesc(userId, PageRequest.of(0, limit))
                .stream()
                .map(item -> new SearchHistoryItemResponse(
                        item.getId(),
                        item.getQueryValue(),
                        item.getResultCount(),
                        item.getSearchedAt()
                ))
                .toList());
    }

    @Transactional
    public void clearHistory(UUID userId) {
        historyRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public void deleteHistory(UUID userId, UUID historyId) {
        if (historyRepository.deleteByIdAndUserId(historyId, userId) == 0) {
            throw new com.educhain.shared.error.ApiException(
                    org.springframework.http.HttpStatus.NOT_FOUND,
                    com.educhain.shared.error.ErrorCode.RESOURCE_NOT_FOUND,
                    "Search history item was not found",
                    false,
                    Map.of()
            );
        }
    }

    @Transactional(readOnly = true)
    public PopularSearchKeywordListResponse popularKeywords(int limit) {
        return new PopularSearchKeywordListResponse(historyRepository
                .findPopular(clock.instant().minus(Duration.ofDays(30)), PageRequest.of(0, limit))
                .stream()
                .map(item -> new PopularSearchKeywordResponse(
                        item.getQueryValue(),
                        item.getSearchCount()
                ))
                .toList());
    }

    private ScoredResource score(
            SearchableResourceSnapshot candidate,
            String query,
            InteractionSignals interactionSignals
    ) {
        ResourceCardResponse card = candidate.card();
        List<String> tokens = query.isBlank() ? List.of() : List.of(query.split("\\s+"));
        EnumSet<MatchedField> fields = EnumSet.noneOf(MatchedField.class);
        EnumSet<RankingSignal> signals = EnumSet.of(RankingSignal.QUALITY, RankingSignal.FRESHNESS);
        double textScore = 0;
        textScore += scoreField(card.title(), tokens, 12, MatchedField.TITLE, RankingSignal.TITLE_MATCH, fields, signals);
        textScore += scoreField(card.summary(), tokens, 7, MatchedField.SUMMARY, RankingSignal.SUMMARY_MATCH, fields, signals);
        textScore += scoreField(candidate.body(), tokens, 3, MatchedField.BODY, RankingSignal.BODY_MATCH, fields, signals);
        textScore += scoreField(
                card.author().displayName() + " " + card.author().handle(),
                tokens,
                5,
                MatchedField.AUTHOR,
                RankingSignal.AUTHOR_MATCH,
                fields,
                signals
        );
        textScore += scoreField(
                card.category().slug() + " " + card.category().nameKey(),
                tokens,
                5,
                MatchedField.CATEGORY,
                RankingSignal.CATEGORY_MATCH,
                fields,
                signals
        );
        textScore += scoreField(
                String.join(" ", card.tags().stream().map(tag -> tag.name() + " " + tag.slug()).toList()),
                tokens,
                6,
                MatchedField.TAG,
                RankingSignal.TAG_MATCH,
                fields,
                signals
        );

        double quality = Math.min(10, card.summary().length() / 80.0 + card.tags().size() * 0.7 + 4);
        long ageDays = Math.max(0, ChronoUnit.DAYS.between(card.publishedAt(), clock.instant()));
        double freshness = Math.max(0, 8 - ageDays / 30.0);
        double popularity = interactionSignals.robustPopularity();
        if (interactionSignals.present()) signals.add(RankingSignal.POPULARITY);
        double score = textScore + quality + freshness + popularity;
        return new ScoredResource(
                card,
                fields,
                signals,
                highlights(card, candidate.body(), fields, query),
                score,
                quality,
                popularity
        );
    }

    private double scoreField(
            String value,
            List<String> tokens,
            double weight,
            MatchedField field,
            RankingSignal signal,
            Set<MatchedField> fields,
            Set<RankingSignal> signals
    ) {
        String normalizedValue = normalize(value);
        long matches = tokens.stream().filter(normalizedValue::contains).count();
        if (matches > 0) {
            fields.add(field);
            signals.add(signal);
        }
        return matches * weight;
    }

    private List<SearchHighlightResponse> highlights(
            ResourceCardResponse card,
            String body,
            Set<MatchedField> fields,
            String query
    ) {
        if (query.isBlank()) return List.of();
        List<SearchHighlightResponse> highlights = new ArrayList<>();
        if (fields.contains(MatchedField.TITLE)) {
            highlights.add(new SearchHighlightResponse(MatchedField.TITLE, card.title()));
        }
        if (fields.contains(MatchedField.SUMMARY)) {
            highlights.add(new SearchHighlightResponse(MatchedField.SUMMARY, snippet(card.summary(), query)));
        }
        if (fields.contains(MatchedField.BODY) && highlights.size() < 3) {
            highlights.add(new SearchHighlightResponse(MatchedField.BODY, snippet(body, query)));
        }
        return highlights.stream().limit(3).toList();
    }

    private String snippet(String value, String query) {
        String normalizedValue = normalize(value);
        String firstToken = query.split("\\s+", 2)[0];
        int match = normalizedValue.indexOf(firstToken);
        int start = Math.max(0, match - 70);
        int end = Math.min(value.length(), start + 220);
        String result = value.substring(start, end).strip();
        return (start > 0 ? "…" : "") + result + (end < value.length() ? "…" : "");
    }

    private boolean matchesFilters(
            ScoredResource scored,
            String category,
            List<String> tags,
            String author
    ) {
        ResourceCardResponse card = scored.card();
        if (!category.isBlank() && !normalize(card.category().slug()).equals(category)) return false;
        if (!author.isBlank() && !normalize(card.author().handle()).equals(author)) return false;
        Set<String> resourceTags = card.tags().stream().map(tag -> normalize(tag.slug())).collect(java.util.stream.Collectors.toSet());
        return tags.isEmpty() || resourceTags.containsAll(tags);
    }

    private Comparator<ScoredResource> comparator(ResourceSort sort) {
        Comparator<ScoredResource> primary = switch (sort) {
            case RELEVANCE -> Comparator.comparingDouble(ScoredResource::score).reversed();
            case NEWEST -> Comparator.comparing(
                    scored -> scored.card().publishedAt(),
                    Comparator.reverseOrder()
            );
            case QUALITY -> Comparator.comparingDouble(ScoredResource::quality).reversed();
            case POPULAR -> Comparator.comparingDouble(ScoredResource::popularity).reversed();
        };
        return primary
                .thenComparing(scored -> scored.card().publishedAt(), Comparator.reverseOrder())
                .thenComparing(scored -> scored.card().id(), Comparator.reverseOrder());
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream().map(this::normalize).filter(tag -> !tag.isBlank()).distinct().sorted().toList();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private SearchCursor decodeCursor(String cursor, String expectedSignature) {
        if (cursor == null || cursor.isBlank()) return new SearchCursor(UUID.randomUUID(), 0);
        try {
            String value = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = value.split(":", -1);
            if (parts.length != 4 || !parts[0].equals("v1") || !parts[3].equals(expectedSignature)) {
                throw new IllegalArgumentException();
            }
            int offset = Integer.parseInt(parts[2]);
            if (offset < 0 || offset > CANDIDATE_LIMIT) throw new IllegalArgumentException();
            return new SearchCursor(UUID.fromString(parts[1]), offset);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Search cursor is invalid.");
        }
    }

    private String encodeCursor(UUID queryId, int offset, String signature) {
        String value = String.join(":", "v1", queryId.toString(), Integer.toString(offset), signature);
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String signature(
            String query,
            String category,
            List<String> tags,
            String author,
            ResourceSort sort
    ) {
        return sha256(String.join("\n", query, category, String.join(",", tags), author, sort.name()));
    }

    private void recordEvent(
            UUID queryId,
            String query,
            String category,
            List<String> tags,
            String author,
            ResourceSort sort,
            int resultCount
    ) {
        String filterSummary = objectMapper.writeValueAsString(Map.of(
                "category", category,
                "tags", tags,
                "author", author,
                "sort", sort.name()
        ));
        Instant now = clock.instant();
        eventRepository.save(new SearchEventEntity(
                queryId,
                sha256(query),
                query.length(),
                filterSummary,
                resultCount,
                now.plus(EVENT_RETENTION)
        ));
    }

    private void recordHistory(UUID userId, String query, int resultCount) {
        if (userId == null || query.isBlank()) return;
        Instant now = clock.instant();
        historyRepository.deleteAllByUserIdAndSearchedAtBefore(
                userId,
                now.minus(EVENT_RETENTION)
        );
        historyRepository.save(new com.educhain.search.entity.SearchHistoryEntity(
                userId,
                query,
                resultCount,
                now
        ));
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private record SearchCursor(UUID queryId, int offset) {
    }

    private record ScoredResource(
            ResourceCardResponse card,
            Set<MatchedField> matchedFields,
            Set<RankingSignal> rankingSignals,
            List<SearchHighlightResponse> highlights,
            double score,
            double quality,
            double popularity
    ) {
        SearchResourceItemResponse response() {
            return new SearchResourceItemResponse(
                    card,
                    List.copyOf(matchedFields),
                    highlights,
                    List.copyOf(rankingSignals)
            );
        }
    }
}

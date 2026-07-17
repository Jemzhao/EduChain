package com.educhain.community.service;

import com.educhain.community.dto.CommunityCreatorResponse;
import com.educhain.community.dto.CommunityFeedItemResponse;
import com.educhain.community.dto.CommunityFeedScope;
import com.educhain.community.dto.CommunityFeedType;
import com.educhain.community.dto.CommunityOverviewResponse;
import com.educhain.community.dto.CommunityStatisticsResponse;
import com.educhain.community.dto.CommunityTopicResponse;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.interaction.repository.ResourceLikeRepository;
import com.educhain.interaction.service.InteractionSignalReadService;
import com.educhain.interaction.service.InteractionSignals;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.dto.ResourceCardResponse;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.service.KnowledgeSearchReadService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.social.service.SocialAudienceService;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityService {

    private static final int CANDIDATE_LIMIT = 200;

    private final KnowledgeSearchReadService knowledgeReadService;
    private final KnowledgeResourceRepository resourceRepository;
    private final UserAccountRepository accountRepository;
    private final ResourceLikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final InteractionSignalReadService interactionSignals;
    private final SocialAudienceService socialAudienceService;

    public CommunityService(
            KnowledgeSearchReadService knowledgeReadService,
            KnowledgeResourceRepository resourceRepository,
            UserAccountRepository accountRepository,
            ResourceLikeRepository likeRepository,
            CommentRepository commentRepository,
            InteractionSignalReadService interactionSignals,
            SocialAudienceService socialAudienceService
    ) {
        this.knowledgeReadService = knowledgeReadService;
        this.resourceRepository = resourceRepository;
        this.accountRepository = accountRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.interactionSignals = interactionSignals;
        this.socialAudienceService = socialAudienceService;
    }

    @Transactional(readOnly = true)
    public CommunityOverviewResponse overview(
            UUID viewerId,
            CommunityFeedScope requestedScope,
            String cursor,
            int feedLimit
    ) {
        CommunityFeedScope scope = requestedScope == null ? CommunityFeedScope.GLOBAL : requestedScope;
        if (scope == CommunityFeedScope.FOLLOWING && viewerId == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    ErrorCode.AUTHENTICATION_REQUIRED,
                    "Authentication is required for the following feed",
                    false,
                    Map.of()
            );
        }
        List<ResourceCardResponse> cards = knowledgeReadService.candidates(CANDIDATE_LIMIT)
                .stream()
                .map(candidate -> candidate.card())
                .toList();
        Map<UUID, InteractionSignals> signals = interactionSignals.signalsFor(
                cards.stream().map(ResourceCardResponse::id).toList()
        );
        FeedPage feedPage = feed(cards, viewerId, scope, cursor, feedLimit);
        return new CommunityOverviewResponse(
                statistics(),
                topics(cards),
                creators(cards, signals),
                feedPage.items(),
                feedPage.page(),
                scope
        );
    }

    private CommunityStatisticsResponse statistics() {
        return new CommunityStatisticsResponse(
                accountRepository.countByStatus(UserStatus.ACTIVE),
                resourceRepository.countByStatus(ResourceStatus.PUBLISHED),
                likeRepository.count(),
                commentRepository.countByStatus(CommentStatus.VISIBLE)
        );
    }

    private List<CommunityTopicResponse> topics(List<ResourceCardResponse> cards) {
        Map<String, TopicAccumulator> counts = new HashMap<>();
        cards.forEach(card -> card.tags().forEach(tag -> counts
                .computeIfAbsent(tag.slug(), ignored -> new TopicAccumulator(tag.name()))
                .add(card.id())));
        return counts.entrySet().stream()
                .map(entry -> new CommunityTopicResponse(
                        entry.getKey(),
                        entry.getValue().name(),
                        entry.getValue().resourceIds().size()
                ))
                .sorted(Comparator
                        .comparingLong(CommunityTopicResponse::resourceCount).reversed()
                        .thenComparing(CommunityTopicResponse::slug))
                .limit(12)
                .toList();
    }

    private List<CommunityCreatorResponse> creators(
            List<ResourceCardResponse> cards,
            Map<UUID, InteractionSignals> signals
    ) {
        Map<UUID, CreatorAccumulator> creators = new HashMap<>();
        cards.forEach(card -> {
            CreatorAccumulator creator = creators.computeIfAbsent(
                    card.author().id(),
                    ignored -> new CreatorAccumulator(card.author())
            );
            InteractionSignals signal = signals.getOrDefault(card.id(), new InteractionSignals(0, 0, 0));
            creator.add(1 + signal.likes() * 3 + signal.saves() * 2 + signal.comments() * 2);
        });
        return creators.values().stream()
                .map(value -> new CommunityCreatorResponse(
                        value.author(),
                        value.resources(),
                        value.engagement()
                ))
                .sorted(Comparator
                        .comparingLong(CommunityCreatorResponse::engagementScore).reversed()
                        .thenComparing(
                                Comparator.comparingLong(CommunityCreatorResponse::resourceCount)
                                        .reversed()
                        )
                        .thenComparing(item -> item.author().handle()))
                .limit(8)
                .toList();
    }

    private FeedPage feed(
            List<ResourceCardResponse> cards,
            UUID viewerId,
            CommunityFeedScope scope,
            String cursor,
            int limit
    ) {
        int pageIndex = decodeCursor(cursor, scope);
        Set<UUID> followed = scope == CommunityFeedScope.FOLLOWING
                ? new HashSet<>(socialAudienceService.followedIds(viewerId))
                : Set.of();
        List<ResourceCardResponse> matching = cards.stream()
                .filter(card -> scope == CommunityFeedScope.GLOBAL || followed.contains(card.author().id()))
                .sorted(Comparator.comparing(ResourceCardResponse::publishedAt).reversed())
                .toList();
        long requestedOffset = (long) pageIndex * limit;
        int fromIndex = (int) Math.min(requestedOffset, matching.size());
        int toIndex = Math.min(fromIndex + limit, matching.size());
        List<CommunityFeedItemResponse> items = matching.subList(fromIndex, toIndex).stream()
                .map(card -> new CommunityFeedItemResponse(
                        card.id(),
                        CommunityFeedType.RESOURCE_PUBLISHED,
                        card,
                        card.publishedAt()
                ))
                .toList();
        boolean hasMore = toIndex < matching.size();
        return new FeedPage(
                items,
                new PageInfoResponse(hasMore ? encodeCursor(pageIndex + 1, scope) : null, hasMore)
        );
    }

    private int decodeCursor(String cursor, CommunityFeedScope scope) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String prefix = "community:" + scope.name() + ":";
            if (!decoded.startsWith(prefix)) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(prefix.length()));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page, CommunityFeedScope scope) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("community:" + scope.name() + ":" + page).getBytes(StandardCharsets.UTF_8)
        );
    }

    private record FeedPage(List<CommunityFeedItemResponse> items, PageInfoResponse page) {
    }

    private static final class TopicAccumulator {
        private final String name;
        private final Set<UUID> resourceIds = new HashSet<>();

        private TopicAccumulator(String name) {
            this.name = name;
        }

        private void add(UUID resourceId) {
            resourceIds.add(resourceId);
        }

        private String name() {
            return name;
        }

        private Set<UUID> resourceIds() {
            return resourceIds;
        }
    }

    private static final class CreatorAccumulator {
        private final ResourceAuthorResponse author;
        private long resources;
        private long engagement;

        private CreatorAccumulator(ResourceAuthorResponse author) {
            this.author = author;
        }

        private void add(long score) {
            resources++;
            engagement += score;
        }

        private ResourceAuthorResponse author() {
            return author;
        }

        private long resources() {
            return resources;
        }

        private long engagement() {
            return engagement;
        }
    }
}

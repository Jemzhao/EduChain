package com.educhain.discovery.service;

import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.service.ActivityService;
import com.educhain.discovery.dto.BrowsingHistoryItemResponse;
import com.educhain.discovery.dto.BrowsingHistoryResponse;
import com.educhain.discovery.dto.ResourceStatisticsResponse;
import com.educhain.discovery.dto.ResourceViewResponse;
import com.educhain.discovery.entity.ResourceViewEntity;
import com.educhain.discovery.repository.ResourceViewRepository;
import com.educhain.discovery.entity.RecommendationFeedbackEntity;
import com.educhain.discovery.dto.RecommendationFeedbackResponse;
import com.educhain.discovery.repository.RecommendationFeedbackRepository;
import com.educhain.interaction.service.InteractionSignalReadService;
import com.educhain.interaction.service.InteractionSignals;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceCardResponse;
import com.educhain.knowledge.dto.ResourceListResponse;
import com.educhain.knowledge.dto.ResourceSort;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.knowledge.service.ResourceQueryService;
import com.educhain.knowledge.service.ResourceResponseFactory;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceDiscoveryService {

    private final ResourceViewRepository viewRepository;
    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final ResourceResponseFactory responseFactory;
    private final ResourceQueryService queryService;
    private final InteractionSignalReadService interactionSignals;
    private final ActivityService activityService;
    private final Clock clock;
    private final RecommendationFeedbackRepository feedbackRepository;

    public ResourceDiscoveryService(
            ResourceViewRepository viewRepository,
            KnowledgeResourceRepository resourceRepository,
            KnowledgeVersionRepository versionRepository,
            ResourceResponseFactory responseFactory,
            ResourceQueryService queryService,
            InteractionSignalReadService interactionSignals,
            ActivityService activityService,
            Clock clock,
            RecommendationFeedbackRepository feedbackRepository
    ) {
        this.viewRepository = viewRepository;
        this.resourceRepository = resourceRepository;
        this.versionRepository = versionRepository;
        this.responseFactory = responseFactory;
        this.queryService = queryService;
        this.interactionSignals = interactionSignals;
        this.activityService = activityService;
        this.clock = clock;
        this.feedbackRepository = feedbackRepository;
    }

    @Transactional
    public ResourceViewResponse recordView(UUID userId, UUID resourceId, String rawViewerKey) {
        requirePublished(resourceId);
        String viewerKey = digest(rawViewerKey.trim());
        ResourceViewEntity view = viewRepository.findByResourceIdAndViewerKey(resourceId, viewerKey)
                .orElseGet(() -> viewRepository.save(new ResourceViewEntity(
                        resourceId,
                        userId,
                        viewerKey,
                        clock.instant()
                )));
        view.touch(userId, clock.instant());
        activityService.record(userId, ActivityType.VIEWED_RESOURCE, resourceId);
        viewRepository.flush();
        return new ResourceViewResponse(resourceId, viewRepository.countByResourceId(resourceId));
    }

    @Transactional(readOnly = true)
    public ResourceStatisticsResponse statistics(UUID resourceId) {
        requirePublished(resourceId);
        InteractionSignals signals = interactionSignals.signals(resourceId);
        return new ResourceStatisticsResponse(
                resourceId,
                viewRepository.countByResourceId(resourceId),
                signals.likes(),
                signals.saves(),
                signals.comments()
        );
    }

    @Transactional(readOnly = true)
    public BrowsingHistoryResponse history(UUID userId, int limit) {
        List<ResourceViewEntity> views = viewRepository.findAllByUserIdOrderByLastViewedAtDesc(
                userId,
                PageRequest.of(0, Math.min(limit * 3, 100))
        );
        Set<UUID> seen = new HashSet<>();
        List<BrowsingHistoryItemResponse> items = new ArrayList<>();
        for (ResourceViewEntity view : views) {
            if (!seen.add(view.getResourceId())) continue;
            resourceCard(view.getResourceId()).ifPresent(card -> items.add(
                    new BrowsingHistoryItemResponse(card, view.getLastViewedAt())
            ));
            if (items.size() == limit) break;
        }
        return new BrowsingHistoryResponse(items);
    }

    @Transactional
    public void clearHistory(UUID userId) {
        viewRepository.deleteAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public ResourceListResponse recommendations(UUID userId, int limit) {
        List<ResourceCardResponse> candidates = queryService.list(
                null,
                50,
                null,
                null,
                ResourceSort.NEWEST
        ).items();
        Set<UUID> viewed = userId == null
                ? Set.of()
                : viewRepository.findAllByUserIdOrderByLastViewedAtDesc(userId, PageRequest.of(0, 100))
                        .stream()
                        .map(ResourceViewEntity::getResourceId)
                        .collect(java.util.stream.Collectors.toSet());
        Set<UUID> dismissed = userId == null
                ? Set.of()
                : feedbackRepository.findAllByUserId(userId).stream()
                        .map(RecommendationFeedbackEntity::getResourceId)
                        .collect(java.util.stream.Collectors.toSet());
        Map<UUID, InteractionSignals> signals = interactionSignals.signalsFor(
                candidates.stream().map(ResourceCardResponse::id).toList()
        );
        List<ResourceCardResponse> ranked = candidates.stream()
                .filter(card -> !dismissed.contains(card.id()))
                .sorted(Comparator.comparingDouble((ResourceCardResponse card) -> {
                    InteractionSignals signal = signals.getOrDefault(
                            card.id(),
                            new InteractionSignals(0, 0, 0)
                    );
                    double score = signal.robustPopularity()
                            + Math.log1p(viewRepository.countByResourceId(card.id()));
                    return viewed.contains(card.id()) ? score - 3 : score;
                }).reversed())
                .limit(limit)
                .toList();
        return new ResourceListResponse(ranked, new PageInfoResponse(null, false));
    }

    @Transactional
    public RecommendationFeedbackResponse dismissRecommendation(UUID userId, UUID resourceId) {
        requirePublished(resourceId);
        RecommendationFeedbackEntity feedback = feedbackRepository
                .findByUserIdAndResourceId(userId, resourceId)
                .orElseGet(() -> feedbackRepository.save(
                        new RecommendationFeedbackEntity(userId, resourceId)
                ));
        feedback.dismiss();
        feedbackRepository.flush();
        return new RecommendationFeedbackResponse(
                resourceId,
                feedback.getFeedbackType(),
                feedback.getUpdatedAt()
        );
    }

    private java.util.Optional<ResourceCardResponse> resourceCard(UUID resourceId) {
        return resourceRepository.findById(resourceId)
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .filter(resource -> resource.getCurrentPublicVersionId() != null)
                .flatMap(resource -> versionRepository.findById(resource.getCurrentPublicVersionId())
                        .map(version -> responseFactory.card(resource, version)));
    }

    private KnowledgeResourceEntity requirePublished(UUID resourceId) {
        return resourceRepository.findById(resourceId)
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "Resource was not found",
                        false,
                        Map.of()
                ));
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}

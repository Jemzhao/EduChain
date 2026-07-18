package com.educhain.achievement.service;

import com.educhain.achievement.dto.AchievementCatalogResponse;
import com.educhain.achievement.dto.AchievementDefinitionResponse;
import com.educhain.achievement.dto.AchievementLevel;
import com.educhain.achievement.dto.AchievementMetric;
import com.educhain.achievement.dto.AchievementProfileResponse;
import com.educhain.achievement.dto.AchievementStatisticsResponse;
import com.educhain.achievement.dto.LeaderboardEntryResponse;
import com.educhain.achievement.dto.LeaderboardResponse;
import com.educhain.achievement.dto.UserAchievementResponse;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.interaction.repository.ResourceLikeRepository;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.platform.port.KnowledgeStatisticsPort;
import com.educhain.platform.port.SocialStatisticsPort;
import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.repository.UserActivityRepository;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.repository.UserAccountRepository;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AchievementService {

    private static final List<AchievementDefinitionResponse> CATALOG = List.of(
            definition("first-publication", "FIRST_PUBLICATION", AchievementMetric.PUBLISHED_RESOURCES, 1, 40),
            definition("knowledge-builder", "KNOWLEDGE_BUILDER", AchievementMetric.PUBLISHED_RESOURCES, 5, 120),
            definition("community-voice", "COMMUNITY_VOICE", AchievementMetric.COMMENTS, 10, 80),
            definition("appreciated", "APPRECIATED", AchievementMetric.RECEIVED_LIKES, 25, 120),
            definition("trusted-creator", "TRUSTED_CREATOR", AchievementMetric.FOLLOWERS, 10, 150),
            definition("curious-reader", "CURIOUS_READER", AchievementMetric.VIEWED_RESOURCES, 20, 50)
    );

    private final KnowledgeStatisticsPort knowledgeStatistics;
    private final CommentRepository commentRepository;
    private final ResourceLikeRepository likeRepository;
    private final SocialStatisticsPort socialStatistics;
    private final UserActivityRepository activityRepository;
    private final UserAccountRepository accountRepository;
    private final UserService userService;

    public AchievementService(
            KnowledgeStatisticsPort knowledgeStatistics,
            CommentRepository commentRepository,
            ResourceLikeRepository likeRepository,
            SocialStatisticsPort socialStatistics,
            UserActivityRepository activityRepository,
            UserAccountRepository accountRepository,
            UserService userService
    ) {
        this.knowledgeStatistics = knowledgeStatistics;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.socialStatistics = socialStatistics;
        this.activityRepository = activityRepository;
        this.accountRepository = accountRepository;
        this.userService = userService;
    }

    public AchievementCatalogResponse catalog() {
        return new AchievementCatalogResponse(CATALOG);
    }

    @Transactional(readOnly = true)
    public AchievementProfileResponse profile(UUID userId) {
        Score score = score(userId);
        List<UserAchievementResponse> items = CATALOG.stream()
                .map(item -> new UserAchievementResponse(
                        item,
                        metric(score.statistics(), item.metric()),
                        metric(score.statistics(), item.metric()) >= item.target()
                ))
                .toList();
        return new AchievementProfileResponse(
                score.points(),
                level(score.points()),
                nextLevelPoints(score.points()),
                items.stream().filter(UserAchievementResponse::unlocked).count(),
                score.statistics(),
                items
        );
    }

    @Transactional(readOnly = true)
    public LeaderboardResponse leaderboard(int limit) {
        List<RankedUser> ranked = accountRepository.findAllByStatus(UserStatus.ACTIVE)
                .stream()
                .map(account -> new RankedUser(account.getId(), score(account.getId())))
                .sorted(Comparator
                        .comparingLong((RankedUser item) -> item.score().points()).reversed()
                        .thenComparing(item -> item.userId().toString()))
                .limit(limit)
                .toList();
        Map<UUID, PublicAuthorSnapshot> authors = userService.getPublicAuthors(
                ranked.stream().map(RankedUser::userId).toList()
        );
        return new LeaderboardResponse(IntStream.range(0, ranked.size())
                .mapToObj(index -> {
                    RankedUser item = ranked.get(index);
                    PublicAuthorSnapshot author = authors.get(item.userId());
                    return new LeaderboardEntryResponse(
                            index + 1,
                            new ResourceAuthorResponse(
                                    author.id(),
                                    author.handle(),
                                    author.displayName(),
                                    author.avatarUrl()
                            ),
                            item.score().points(),
                            level(item.score().points()),
                            item.score().statistics().publishedResources(),
                            item.score().statistics().receivedLikes()
                    );
                })
                .toList());
    }

    private Score score(UUID userId) {
        AchievementStatisticsResponse statistics = new AchievementStatisticsResponse(
                knowledgeStatistics.publishedCount(userId),
                commentRepository.countByAuthorIdAndStatus(userId, CommentStatus.VISIBLE),
                likeRepository.countReceivedByAuthorId(userId),
                socialStatistics.statistics(userId).followers(),
                activityRepository.countByUserIdAndType(userId, ActivityType.VIEWED_RESOURCE)
        );
        long points = statistics.publishedResources() * 40
                + statistics.comments() * 3
                + statistics.receivedLikes() * 5
                + statistics.followers() * 10
                + Math.min(statistics.viewedResources(), 100);
        return new Score(points, statistics);
    }

    private long metric(AchievementStatisticsResponse statistics, AchievementMetric metric) {
        return switch (metric) {
            case PUBLISHED_RESOURCES -> statistics.publishedResources();
            case COMMENTS -> statistics.comments();
            case RECEIVED_LIKES -> statistics.receivedLikes();
            case FOLLOWERS -> statistics.followers();
            case VIEWED_RESOURCES -> statistics.viewedResources();
        };
    }

    private AchievementLevel level(long points) {
        if (points >= 1_500) return AchievementLevel.MENTOR;
        if (points >= 700) return AchievementLevel.SCHOLAR;
        if (points >= 300) return AchievementLevel.CURATOR;
        if (points >= 100) return AchievementLevel.CONTRIBUTOR;
        return AchievementLevel.LEARNER;
    }

    private Long nextLevelPoints(long points) {
        if (points < 100) return 100L;
        if (points < 300) return 300L;
        if (points < 700) return 700L;
        if (points < 1_500) return 1_500L;
        return null;
    }

    private static AchievementDefinitionResponse definition(
            String id,
            String key,
            AchievementMetric metric,
            long target,
            int points
    ) {
        return new AchievementDefinitionResponse(
                id,
                "achievement." + key + ".title",
                "achievement." + key + ".description",
                metric,
                target,
                points
        );
    }

    private record Score(long points, AchievementStatisticsResponse statistics) {
    }

    private record RankedUser(UUID userId, Score score) {
    }
}

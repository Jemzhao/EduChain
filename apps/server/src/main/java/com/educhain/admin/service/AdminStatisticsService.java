package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.repository.AdminStatisticsQueryRepository;
import com.educhain.discovery.repository.ResourceViewRepository;
import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.repository.EvidenceRecordRepository;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.interaction.repository.ResourceLikeRepository;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.service.KnowledgeSearchReadService;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.repository.UserAccountRepository;
import java.util.Comparator;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminStatisticsService {

    private final UserAccountRepository users;
    private final KnowledgeResourceRepository resources;
    private final CommentRepository comments;
    private final ResourceLikeRepository likes;
    private final ResourceViewRepository views;
    private final EvidenceRecordRepository evidence;
    private final KnowledgeSearchReadService knowledgeReadService;
    private final AdminStatisticsQueryRepository statisticsQueries;
    private final Clock clock;

    public AdminStatisticsService(
            UserAccountRepository users,
            KnowledgeResourceRepository resources,
            CommentRepository comments,
            ResourceLikeRepository likes,
            ResourceViewRepository views,
            EvidenceRecordRepository evidence,
            KnowledgeSearchReadService knowledgeReadService,
            AdminStatisticsQueryRepository statisticsQueries,
            Clock clock
    ) {
        this.users = users;
        this.resources = resources;
        this.comments = comments;
        this.likes = likes;
        this.views = views;
        this.evidence = evidence;
        this.knowledgeReadService = knowledgeReadService;
        this.statisticsQueries = statisticsQueries;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AdminModels.StatisticsResponse statistics() {
        var cards = knowledgeReadService.candidates(500).stream()
                .map(candidate -> candidate.card())
                .toList();
        return new AdminModels.StatisticsResponse(
                users.countByStatus(UserStatus.ACTIVE),
                resources.countByStatus(ResourceStatus.PUBLISHED),
                comments.countByStatus(CommentStatus.VISIBLE),
                likes.count(),
                views.count(),
                evidence.count(),
                buckets(cards.stream().map(card -> card.category().slug())
                        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))),
                buckets(cards.stream().flatMap(card -> card.tags().stream())
                        .map(tag -> tag.slug())
                        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))),
                buckets(cards.stream().map(card -> card.resourceType().name())
                        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))),
                java.util.Arrays.stream(EvidenceBackendType.values())
                        .map(backend -> new AdminModels.StatisticsBucket(
                                backend.name(),
                                evidence.countByBackend(backend)
                        ))
                        .toList(),
                trends()
        );
    }

    @Transactional(readOnly = true)
    public byte[] csv() {
        AdminModels.StatisticsResponse statistics = statistics();
        StringBuilder csv = new StringBuilder("section,key,value\n");
        row(csv, "total", "users", statistics.users());
        row(csv, "total", "published_resources", statistics.publishedResources());
        row(csv, "total", "comments", statistics.comments());
        row(csv, "total", "likes", statistics.likes());
        row(csv, "total", "views", statistics.views());
        row(csv, "total", "evidence_records", statistics.evidenceRecords());
        statistics.categories().forEach(item -> row(csv, "category", item.key(), item.count()));
        statistics.tags().forEach(item -> row(csv, "tag", item.key(), item.count()));
        statistics.resourceTypes().forEach(item -> row(csv, "resource_type", item.key(), item.count()));
        statistics.evidenceBackends().forEach(item -> row(csv, "evidence_backend", item.key(), item.count()));
        csv.append("trend_period,registrations,publications,views\n");
        statistics.trends().forEach(item -> csv.append(item.period()).append(',')
                .append(item.registrations()).append(',')
                .append(item.publications()).append(',')
                .append(item.views()).append('\n'));
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private java.util.List<AdminModels.StatisticsTrend> trends() {
        LocalDate end = LocalDate.now(clock.withZone(ZoneOffset.UTC));
        LocalDate start = end.minusDays(13);
        var registrations = statisticsQueries.registrations(start.atStartOfDay().toInstant(ZoneOffset.UTC));
        var publications = statisticsQueries.publications(start.atStartOfDay().toInstant(ZoneOffset.UTC));
        var viewCounts = statisticsQueries.views(start.atStartOfDay().toInstant(ZoneOffset.UTC));
        return start.datesUntil(end.plusDays(1))
                .map(day -> new AdminModels.StatisticsTrend(
                        day.toString(),
                        registrations.getOrDefault(day.toString(), 0L),
                        publications.getOrDefault(day.toString(), 0L),
                        viewCounts.getOrDefault(day.toString(), 0L)
                ))
                .toList();
    }

    private void row(StringBuilder csv, String section, String key, long value) {
        csv.append(section).append(',').append(csvValue(key)).append(',').append(value).append('\n');
    }

    private String csvValue(String value) {
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    private java.util.List<AdminModels.StatisticsBucket> buckets(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .map(entry -> new AdminModels.StatisticsBucket(entry.getKey(), entry.getValue()))
                .sorted(Comparator
                        .comparingLong(AdminModels.StatisticsBucket::count).reversed()
                        .thenComparing(AdminModels.StatisticsBucket::key))
                .toList();
    }
}

package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.service.AuditService;
import com.educhain.interaction.dto.ReportResponse;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.domain.ReportStatus;
import com.educhain.interaction.service.GovernanceCommentView;
import com.educhain.interaction.service.InteractionGovernanceService;
import com.educhain.interaction.service.ReportService;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.service.GovernanceResourceView;
import com.educhain.knowledge.service.KnowledgeGovernanceService;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminContentService {

    private final KnowledgeGovernanceService resources;
    private final InteractionGovernanceService comments;
    private final ReportService reports;
    private final AuditService audit;
    private final NotificationService notifications;
    private final AdminModelMapper mapper;

    public AdminContentService(
            KnowledgeGovernanceService resources,
            InteractionGovernanceService comments,
            ReportService reports,
            AuditService audit,
            NotificationService notifications,
            AdminModelMapper mapper
    ) {
        this.resources = resources;
        this.comments = comments;
        this.reports = reports;
        this.audit = audit;
        this.notifications = notifications;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminModels.ResourceListResponse resourceList(ResourceStatus status, int limit) {
        Page<GovernanceResourceView> page = resources.list(status, limit);
        return new AdminModels.ResourceListResponse(
                page.map(mapper::resource).getContent(),
                mapper.pageInfo(page)
        );
    }

    @Transactional
    public AdminModels.ResourceResponse withdrawResource(
            UUID actorId,
            UUID resourceId,
            String reason,
            String requestId
    ) {
        GovernanceResourceView view = resources.withdraw(resourceId);
        notifyResourceStatus(actorId, view);
        audit.succeeded(actorId, "RESOURCE_WITHDRAWN", "RESOURCE", resourceId, reason, requestId);
        return mapper.resource(view);
    }

    @Transactional
    public AdminModels.ResourceResponse restoreResource(
            UUID actorId,
            UUID resourceId,
            String reason,
            String requestId
    ) {
        GovernanceResourceView view = resources.restore(resourceId);
        notifyResourceStatus(actorId, view);
        audit.succeeded(actorId, "RESOURCE_RESTORED", "RESOURCE", resourceId, reason, requestId);
        return mapper.resource(view);
    }

    @Transactional
    public AdminModels.BatchResultResponse reviewResources(
            UUID actorId,
            AdminModels.ResourceReviewBatchRequest request,
            String requestId
    ) {
        int processed = 0;
        for (UUID resourceId : request.resourceIds().stream().distinct().toList()) {
            if (request.decision() == AdminModels.ResourceReviewDecision.APPROVE) {
                restoreResource(actorId, resourceId, request.reason().trim(), requestId);
            } else {
                withdrawResource(actorId, resourceId, request.reason().trim(), requestId);
            }
            processed += 1;
        }
        return new AdminModels.BatchResultResponse(processed);
    }

    @Transactional
    public String exportResources(UUID actorId, String reason, String requestId) {
        StringBuilder csv = new StringBuilder(
                "id,slug,title,author_handle,status,evidence_status,published_at\n"
        );
        resources.list(null, 50).forEach(view -> csv.append(mapper.csv(view.id().toString()))
                .append(',').append(mapper.csv(view.slug()))
                .append(',').append(mapper.csv(view.title()))
                .append(',').append(mapper.csv(view.author().handle()))
                .append(',').append(mapper.csv(view.status().name()))
                .append(',').append(mapper.csv(view.evidenceStatus().name()))
                .append(',').append(mapper.csv(
                        view.publishedAt() == null ? "" : view.publishedAt().toString()
                ))
                .append('\n'));
        audit.succeeded(
                actorId,
                "RESOURCES_EXPORTED",
                "RESOURCE_EXPORT",
                UUID.randomUUID(),
                reason,
                requestId
        );
        return csv.toString();
    }

    private void notifyResourceStatus(UUID actorId, GovernanceResourceView view) {
        notifications.emit(new NotificationIntent(
                view.author().id(),
                NotificationType.RESOURCE_STATUS,
                "resource-status:" + view.id() + ":" + view.status() + ":" + view.version(),
                actorId,
                view.id(),
                null
        ));
    }

    @Transactional(readOnly = true)
    public AdminModels.CommentListResponse commentList(CommentStatus status, int limit) {
        Page<GovernanceCommentView> page = comments.list(status, limit);
        return new AdminModels.CommentListResponse(
                page.map(mapper::comment).getContent(),
                mapper.pageInfo(page)
        );
    }

    @Transactional
    public AdminModels.CommentResponse hideComment(
            UUID actorId,
            UUID commentId,
            String reason,
            String requestId
    ) {
        GovernanceCommentView view = comments.hide(commentId);
        audit.succeeded(actorId, "COMMENT_HIDDEN", "COMMENT", commentId, reason, requestId);
        return mapper.comment(view);
    }

    @Transactional
    public AdminModels.CommentResponse restoreComment(
            UUID actorId,
            UUID commentId,
            String reason,
            String requestId
    ) {
        GovernanceCommentView view = comments.restore(commentId);
        audit.succeeded(actorId, "COMMENT_RESTORED", "COMMENT", commentId, reason, requestId);
        return mapper.comment(view);
    }

    @Transactional(readOnly = true)
    public AdminModels.ReportListResponse reportList(ReportStatus status, int limit) {
        Page<ReportResponse> page = reports.list(status, limit);
        return new AdminModels.ReportListResponse(page.getContent(), mapper.pageInfo(page));
    }

    @Transactional
    public ReportResponse resolveReport(
            UUID actorId,
            UUID reportId,
            AdminModels.ReportResolutionRequest request,
            String requestId
    ) {
        ReportResponse report = reports.resolve(
                actorId,
                reportId,
                request.status().toReportStatus(),
                request.reason().trim()
        );
        audit.succeeded(
                actorId,
                "REPORT_" + request.status().name(),
                "REPORT",
                reportId,
                request.reason().trim(),
                requestId
        );
        return report;
    }
}

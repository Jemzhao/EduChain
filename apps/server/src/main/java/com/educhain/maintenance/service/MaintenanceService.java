package com.educhain.maintenance.service;

import com.educhain.audit.service.AuditService;
import com.educhain.maintenance.dto.MaintenanceModels;
import com.educhain.maintenance.entity.MaintenanceJobEntity;
import com.educhain.maintenance.domain.MaintenanceJobType;
import com.educhain.maintenance.repository.MaintenanceJobRepository;
import com.educhain.notification.service.NotificationService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaintenanceService {
    private final MaintenanceJobRepository jobs;
    private final NotificationService notifications;
    private final AuditService audit;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public MaintenanceService(
            MaintenanceJobRepository jobs,
            NotificationService notifications,
            AuditService audit,
            JdbcTemplate jdbc,
            Clock clock
    ) {
        this.jobs = jobs;
        this.notifications = notifications;
        this.audit = audit;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public MaintenanceModels.ListResponse list(int limit) {
        return new MaintenanceModels.ListResponse(jobs
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(this::response)
                .toList());
    }

    @Transactional
    public MaintenanceModels.Response request(
            UUID actorId,
            MaintenanceModels.Request request,
            String requestId
    ) {
        validate(request);
        UUID jobId = UUID.randomUUID();
        MaintenanceJobEntity job = jobs.save(new MaintenanceJobEntity(
                jobId,
                request.type(),
                actorId,
                request.reason().trim(),
                payloadSummary(request)
        ));
        if (request.type() == MaintenanceJobType.BACKUP_REQUEST) {
            job.accept("OPERATOR_ACTION_REQUIRED");
        } else {
            try {
                job.complete(execute(jobId, request), clock.instant());
            } catch (RuntimeException exception) {
                job.fail("OPERATION_FAILED", clock.instant());
            }
        }
        jobs.flush();
        audit.succeeded(
                actorId,
                "MAINTENANCE_" + request.type().name() + "_REQUESTED",
                "MAINTENANCE_JOB",
                jobId,
                request.reason().trim(),
                requestId
        );
        return response(job);
    }

    private String execute(UUID jobId, MaintenanceModels.Request request) {
        return switch (request.type()) {
            case SEARCH_REBUILD -> "DOCUMENTS_REBUILT:" + rebuildSearchDocuments();
            case EXPIRED_DATA_CLEANUP -> "RECORDS_CLEANED:" + cleanupExpiredData();
            case SYSTEM_ANNOUNCEMENT -> "RECIPIENTS_NOTIFIED:" + notifications.broadcast(
                    jobId,
                    request.announcementTitle().trim(),
                    request.announcementBody().trim()
            );
            case BACKUP_REQUEST -> throw new IllegalStateException("Backup requests are external");
        };
    }

    private int rebuildSearchDocuments() {
        jdbc.update("DELETE FROM search_document");
        return jdbc.update("""
                INSERT INTO search_document (
                    resource_id, version_id, title, summary, body_content, rebuilt_at
                )
                SELECT resource.id, version.id, version.title, version.summary,
                       version.body_content, CURRENT_TIMESTAMP(6)
                FROM knowledge_resource resource
                JOIN knowledge_version version ON version.id = resource.current_public_version_id
                WHERE resource.status = 'PUBLISHED'
                """);
    }

    private int cleanupExpiredData() {
        int count = 0;
        count += jdbc.update("DELETE FROM password_reset_token WHERE expires_at < CURRENT_TIMESTAMP(6)");
        count += jdbc.update("DELETE FROM refresh_session WHERE expires_at < CURRENT_TIMESTAMP(6)");
        count += jdbc.update("DELETE FROM search_event WHERE retention_until < CURRENT_TIMESTAMP(6)");
        count += jdbc.update("DELETE FROM idempotency_record WHERE expires_at < CURRENT_TIMESTAMP(6)");
        count += jdbc.update("DELETE FROM verification_event WHERE retention_until < CURRENT_TIMESTAMP(6)");
        count += jdbc.update("DELETE FROM upload_session WHERE expires_at < CURRENT_TIMESTAMP(6)");
        return count;
    }

    private void validate(MaintenanceModels.Request request) {
        boolean announcement = request.type() == MaintenanceJobType.SYSTEM_ANNOUNCEMENT;
        boolean hasAnnouncementPayload = (request.announcementTitle() != null
                && !request.announcementTitle().isBlank())
                || (request.announcementBody() != null
                && !request.announcementBody().isBlank());
        boolean validAnnouncement = request.announcementTitle() != null
                && !request.announcementTitle().isBlank()
                && request.announcementBody() != null
                && request.announcementBody().trim().length() >= 10;
        if ((announcement && !validAnnouncement) || (!announcement && hasAnnouncementPayload)) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FIELD_VALIDATION_FAILED,
                    "Maintenance payload is invalid",
                    false,
                    Map.of()
            );
        }
    }

    private String payloadSummary(MaintenanceModels.Request request) {
        return request.type() == MaintenanceJobType.SYSTEM_ANNOUNCEMENT
                ? request.announcementTitle().trim()
                : request.type().name();
    }

    private MaintenanceModels.Response response(MaintenanceJobEntity job) {
        return new MaintenanceModels.Response(
                job.getId(),
                job.getJobType(),
                job.getStatus(),
                job.getRequestedBy(),
                job.getPayloadSummary(),
                job.getResultSummary(),
                job.getCreatedAt(),
                job.getCompletedAt()
        );
    }
}

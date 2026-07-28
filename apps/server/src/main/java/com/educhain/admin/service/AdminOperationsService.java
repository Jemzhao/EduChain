package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.entity.OperationalAlertEntity;
import com.educhain.admin.domain.OperationalAlertSeverity;
import com.educhain.admin.domain.OperationalAlertStatus;
import com.educhain.admin.repository.OperationalAlertRepository;
import com.educhain.audit.entity.AuditEventEntity;
import com.educhain.audit.service.AuditService;
import com.educhain.evidence.service.EvidenceGovernanceService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOperationsService {

    private final OperationalAlertRepository alerts;
    private final EvidenceGovernanceService evidence;
    private final AuditService audit;
    private final Clock clock;

    public AdminOperationsService(
            OperationalAlertRepository alerts,
            EvidenceGovernanceService evidence,
            AuditService audit,
            Clock clock
    ) {
        this.alerts = alerts;
        this.evidence = evidence;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public AdminModels.OperationalMetricsResponse metrics() {
        Instant sampledAt = clock.instant();
        Runtime runtime = Runtime.getRuntime();
        double heapPercent = percent(runtime.totalMemory() - runtime.freeMemory(), runtime.maxMemory());
        File volume = new File(".");
        double diskPercent = percent(volume.getTotalSpace() - volume.getUsableSpace(), volume.getTotalSpace());
        double load = Math.max(0, ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage());
        double normalizedLoad = load / Math.max(1, runtime.availableProcessors());
        long retryableEvidence = evidence.retryableCount();

        List<AdminModels.OperationalMetric> items = List.of(
                metric("jvm.heap.used", heapPercent, "percent", heapStatus(heapPercent)),
                metric("storage.used", diskPercent, "percent", storageStatus(diskPercent)),
                metric("system.load.per_processor", normalizedLoad, "ratio", loadStatus(normalizedLoad)),
                metric(
                        "evidence.retryable_jobs",
                        retryableEvidence,
                        "count",
                        queueStatus(retryableEvidence)
                )
        );
        items.stream()
                .filter(item -> item.status() != AdminModels.OperationalMetricStatus.HEALTHY)
                .forEach(item -> observe(item, sampledAt));
        return new AdminModels.OperationalMetricsResponse(items, sampledAt);
    }

    @Transactional(readOnly = true)
    public AdminModels.OperationalEventListResponse events(int limit) {
        return new AdminModels.OperationalEventListResponse(
                audit.list(null, limit).stream().map(this::event).toList()
        );
    }

    @Transactional
    public AdminModels.OperationalAlertListResponse alerts() {
        metrics();
        alerts.flush();
        return new AdminModels.OperationalAlertListResponse(
                alerts.findAllByOrderByStatusAscSeverityDescLastSeenAtDesc()
                        .stream()
                        .map(this::alert)
                        .toList()
        );
    }

    @Transactional
    public AdminModels.OperationalAlertResponse resolve(
            UUID alertId,
            long expectedVersion,
            UUID actorId,
            String reason
    ) {
        OperationalAlertEntity alert = alerts.findById(alertId).orElseThrow(this::notFound);
        if (alert.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Operational alert version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(alert.getVersion()))
            );
        }
        if (alert.getStatus() == OperationalAlertStatus.RESOLVED) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "Operational alert is already resolved",
                    false,
                    Map.of()
            );
        }
        alert.resolve(actorId, reason, clock.instant());
        alerts.flush();
        return alert(alert);
    }

    private void observe(AdminModels.OperationalMetric metric, Instant now) {
        OperationalAlertSeverity severity = metric.status()
                == AdminModels.OperationalMetricStatus.CRITICAL
                ? OperationalAlertSeverity.CRITICAL
                : OperationalAlertSeverity.WARNING;
        String summaryCode = metric.name().toUpperCase().replace('.', '_') + "_HIGH";
        alerts.findFirstByComponentNameAndSummaryCodeAndStatus(
                metric.name(),
                summaryCode,
                OperationalAlertStatus.OPEN
        ).ifPresentOrElse(
                alert -> alert.observe(severity, now),
                () -> alerts.save(new OperationalAlertEntity(
                        severity,
                        metric.name(),
                        summaryCode,
                        now
                ))
        );
    }

    private AdminModels.OperationalMetric metric(
            String name,
            double value,
            String unit,
            AdminModels.OperationalMetricStatus status
    ) {
        return new AdminModels.OperationalMetric(name, value, unit, status);
    }

    private AdminModels.OperationalEventResponse event(AuditEventEntity event) {
        String action = event.getActionName();
        String category = action.contains("_") ? action.substring(0, action.indexOf('_')) : action;
        return new AdminModels.OperationalEventResponse(
                event.getId(),
                category,
                action,
                event.getTargetType(),
                event.getResultStatus(),
                event.getCreatedAt()
        );
    }

    private AdminModels.OperationalAlertResponse alert(OperationalAlertEntity alert) {
        return new AdminModels.OperationalAlertResponse(
                alert.getId(),
                alert.getSeverity(),
                alert.getComponentName(),
                alert.getSummaryCode(),
                alert.getStatus(),
                alert.getOccurrenceCount(),
                alert.getFirstSeenAt(),
                alert.getLastSeenAt(),
                alert.getResolvedAt(),
                alert.getResolvedBy(),
                alert.getResolutionReason(),
                alert.getVersion()
        );
    }

    private double percent(long used, long total) {
        return total <= 0 ? 0 : used * 100.0 / total;
    }

    private AdminModels.OperationalMetricStatus heapStatus(double value) {
        return status(value, 75, 90);
    }

    private AdminModels.OperationalMetricStatus storageStatus(double value) {
        return status(value, 85, 95);
    }

    private AdminModels.OperationalMetricStatus loadStatus(double value) {
        return status(value, 1.5, 3);
    }

    private AdminModels.OperationalMetricStatus queueStatus(double value) {
        return status(value, 1, 20);
    }

    private AdminModels.OperationalMetricStatus status(
            double value,
            double warning,
            double critical
    ) {
        if (value >= critical) return AdminModels.OperationalMetricStatus.CRITICAL;
        if (value >= warning) return AdminModels.OperationalMetricStatus.WARNING;
        return AdminModels.OperationalMetricStatus.HEALTHY;
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Operational alert was not found",
                false,
                Map.of()
        );
    }
}

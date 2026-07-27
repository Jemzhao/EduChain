package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.entity.AuditEventEntity;
import com.educhain.audit.service.AuditService;
import com.educhain.evidence.gateway.EvidenceGatewayClient;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminObservabilityService {

    private final AuditService audit;
    private final AdminOperationsService operations;
    private final EvidenceGatewayClient gateway;
    private final DataSource dataSource;
    private final AdminModelMapper mapper;

    public AdminObservabilityService(
            AuditService audit,
            AdminOperationsService operations,
            EvidenceGatewayClient gateway,
            DataSource dataSource,
            AdminModelMapper mapper
    ) {
        this.audit = audit;
        this.operations = operations;
        this.gateway = gateway;
        this.dataSource = dataSource;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminModels.AuditEventListResponse auditEvents(String targetType, int limit) {
        Page<AuditEventEntity> page = audit.list(targetType, limit);
        return new AdminModels.AuditEventListResponse(
                page.map(mapper::audit).getContent(),
                mapper.pageInfo(page)
        );
    }

    public AdminModels.SystemHealthResponse health() {
        List<AdminModels.HealthComponent> components = new ArrayList<>();
        boolean database = databaseAvailable();
        boolean evidenceGateway = gateway.health();
        components.add(new AdminModels.HealthComponent(
                "database",
                database ? AdminModels.HealthStatus.HEALTHY : AdminModels.HealthStatus.UNAVAILABLE,
                database ? "DATABASE_AVAILABLE" : "DATABASE_UNAVAILABLE"
        ));
        components.add(new AdminModels.HealthComponent(
                "evidence-gateway",
                evidenceGateway ? AdminModels.HealthStatus.HEALTHY : AdminModels.HealthStatus.DEGRADED,
                evidenceGateway ? "EVIDENCE_AVAILABLE" : "EVIDENCE_DELAYED"
        ));
        components.add(new AdminModels.HealthComponent(
                "java-server",
                AdminModels.HealthStatus.HEALTHY,
                "SERVER_AVAILABLE"
        ));
        AdminModels.HealthStatus status = !database
                ? AdminModels.HealthStatus.UNAVAILABLE
                : evidenceGateway
                    ? AdminModels.HealthStatus.HEALTHY
                    : AdminModels.HealthStatus.DEGRADED;
        return new AdminModels.SystemHealthResponse(status, List.copyOf(components));
    }

    @Transactional
    public AdminModels.OperationalMetricsResponse operationalMetrics() {
        return operations.metrics();
    }

    @Transactional(readOnly = true)
    public AdminModels.OperationalEventListResponse operationalEvents(int limit) {
        return operations.events(limit);
    }

    @Transactional
    public AdminModels.OperationalAlertListResponse operationalAlerts() {
        return operations.alerts();
    }

    @Transactional
    public AdminModels.OperationalAlertResponse resolveOperationalAlert(
            UUID actorId,
            UUID alertId,
            long expectedVersion,
            String reason,
            String requestId
    ) {
        AdminModels.OperationalAlertResponse response = operations.resolve(
                alertId,
                expectedVersion,
                actorId,
                reason
        );
        audit.succeeded(
                actorId,
                "OPERATIONAL_ALERT_RESOLVED",
                "OPERATIONAL_ALERT",
                alertId,
                reason,
                requestId
        );
        return response;
    }

    private boolean databaseAvailable() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(1);
        } catch (SQLException exception) {
            return false;
        }
    }
}

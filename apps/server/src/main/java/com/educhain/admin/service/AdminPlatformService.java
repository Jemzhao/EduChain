package com.educhain.admin.service;

import com.educhain.audit.service.AuditService;
import com.educhain.platform.dto.PlatformSettingResponse;
import com.educhain.platform.service.PlatformSettingService;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPlatformService {

    private final PlatformSettingService settings;
    private final AuditService audit;
    private final AdminStatisticsService statistics;

    public AdminPlatformService(
            PlatformSettingService settings,
            AuditService audit,
            AdminStatisticsService statistics
    ) {
        this.settings = settings;
        this.audit = audit;
        this.statistics = statistics;
    }

    @Transactional
    public PlatformSettingResponse update(
            UUID actorId,
            String key,
            long expectedVersion,
            String value,
            String reason,
            String requestId
    ) {
        PlatformSettingResponse result = settings.update(actorId, key, expectedVersion, value);
        audit.succeeded(
                actorId,
                "PLATFORM_SETTING_UPDATED",
                "PLATFORM_SETTING",
                UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8)),
                reason,
                requestId
        );
        return result;
    }

    @Transactional
    public byte[] exportStatistics(UUID actorId, String reason, String requestId) {
        byte[] result = statistics.csv();
        audit.succeeded(
                actorId,
                "STATISTICS_EXPORTED",
                "PLATFORM_STATISTICS",
                UUID.nameUUIDFromBytes("platform-statistics".getBytes(StandardCharsets.UTF_8)),
                reason,
                requestId
        );
        return result;
    }
}

package com.educhain.platform.dto;

import com.educhain.platform.domain.PlatformSettingType;
import java.time.Instant;

public record PlatformSettingResponse(
        String key,
        PlatformSettingType type,
        String value,
        boolean publicVisible,
        long version,
        Instant updatedAt
) {
}

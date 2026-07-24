package com.educhain.platform.dto;

import java.util.List;

public record PlatformSettingListResponse(List<PlatformSettingResponse> items) {
    public PlatformSettingListResponse {
        items = List.copyOf(items);
    }
}

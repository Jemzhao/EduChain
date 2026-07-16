package com.educhain.activity.dto;

import java.util.List;

public record ActivityListResponse(List<ActivityItemResponse> items) {
    public ActivityListResponse {
        items = List.copyOf(items);
    }
}

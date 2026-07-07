package com.educhain.knowledge.dto;

import java.util.List;

public record MyResourceListResponse(List<MyResourceSummaryResponse> items) {
    public MyResourceListResponse {
        items = List.copyOf(items);
    }
}

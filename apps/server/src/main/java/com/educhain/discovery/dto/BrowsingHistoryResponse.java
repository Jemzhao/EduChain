package com.educhain.discovery.dto;

import java.util.List;

public record BrowsingHistoryResponse(List<BrowsingHistoryItemResponse> items) {
    public BrowsingHistoryResponse {
        items = List.copyOf(items);
    }
}

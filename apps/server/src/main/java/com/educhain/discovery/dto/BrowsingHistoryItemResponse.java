package com.educhain.discovery.dto;

import com.educhain.knowledge.dto.ResourceCardResponse;
import java.time.Instant;

public record BrowsingHistoryItemResponse(ResourceCardResponse resource, Instant viewedAt) {
}

package com.educhain.search.dto;

import java.time.Instant;
import java.util.UUID;

public record SearchHistoryItemResponse(UUID id, String query, int resultCount, Instant searchedAt) {
}

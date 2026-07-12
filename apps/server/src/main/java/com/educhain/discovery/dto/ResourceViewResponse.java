package com.educhain.discovery.dto;

import java.util.UUID;

public record ResourceViewResponse(UUID resourceId, long viewCount) {
}

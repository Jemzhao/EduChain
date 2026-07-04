package com.educhain.auth.dto;

import java.util.List;

public record SessionListResponse(List<SessionSummaryResponse> items) {
}

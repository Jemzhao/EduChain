package com.educhain.auth.dto;

import com.educhain.user.dto.UserSummaryResponse;

public record AuthenticatedUserResponse(UserSummaryResponse user) {
}

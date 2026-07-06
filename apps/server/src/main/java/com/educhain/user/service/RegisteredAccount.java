package com.educhain.user.service;

import com.educhain.user.dto.UserSummaryResponse;
import java.util.UUID;

public record RegisteredAccount(UUID userId, UserSummaryResponse summary) {
}

package com.educhain.user.service;

import com.educhain.user.dto.UserSummaryResponse;
import com.educhain.user.domain.UserRoleName;
import java.time.Instant;
import java.util.List;

public record GovernanceUserView(
        UserSummaryResponse user,
        String email,
        List<UserRoleName> roles,
        Instant createdAt
) {
}

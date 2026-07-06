package com.educhain.user.service;

import com.educhain.user.dto.UserSummaryResponse;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.domain.UserStatus;
import java.util.List;
import java.util.UUID;

public record AuthenticationView(
        UUID userId,
        String email,
        String handle,
        UserStatus status,
        List<UserRoleName> roles,
        UserSummaryResponse summary
) {
}

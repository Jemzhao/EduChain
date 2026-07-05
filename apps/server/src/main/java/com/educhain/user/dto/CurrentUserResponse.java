package com.educhain.user.dto;

import com.educhain.user.domain.UserRoleName;
import java.util.List;

public record CurrentUserResponse(
        UserSummaryResponse user,
        String email,
        List<UserRoleName> roles,
        ProfileDetailsResponse profile
) {
}

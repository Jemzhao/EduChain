package com.educhain.auth.service;

import com.educhain.auth.dto.AuthenticatedUserResponse;

public record AuthenticationResult(
        AuthenticatedUserResponse response,
        SessionCredentials credentials
) {
}

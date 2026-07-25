package com.educhain.platform.security;

import java.util.List;
import java.util.UUID;

public record EduChainPrincipal(
        UUID userId,
        UUID sessionId,
        String handle,
        List<String> roles
) {
    public EduChainPrincipal {
        roles = List.copyOf(roles);
    }
}

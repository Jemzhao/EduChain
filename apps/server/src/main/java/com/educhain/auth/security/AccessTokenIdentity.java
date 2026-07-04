package com.educhain.auth.security;

import java.util.UUID;

public record AccessTokenIdentity(UUID userId, UUID sessionId) {
}

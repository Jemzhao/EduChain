package com.educhain.auth.service;

import java.util.UUID;

public record SessionCredentials(UUID sessionId, String accessToken, String refreshToken) {
}

package com.educhain.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;

public record ClientContext(
        String deviceLabel,
        String userAgentHash,
        String ipPrefixHash
) {
    public static ClientContext from(HttpServletRequest request, TokenGenerator tokenGenerator) {
        String userAgent = safe(request.getHeader("User-Agent"));
        String forwarded = safe(request.getHeader("X-Forwarded-For"));
        String remoteAddress = forwarded.isBlank()
                ? safe(request.getRemoteAddr())
                : forwarded.split(",", 2)[0].trim();
        return new ClientContext(
                deviceLabel(userAgent),
                userAgent.isBlank() ? null : tokenGenerator.hash(userAgent),
                remoteAddress.isBlank() ? null : tokenGenerator.hash(remoteAddress)
        );
    }

    private static String deviceLabel(String userAgent) {
        String normalized = userAgent.toLowerCase(Locale.ROOT);
        if (normalized.contains("mobile")) {
            return "Mobile browser";
        }
        return userAgent.isBlank() ? "Unknown browser" : "Desktop browser";
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}

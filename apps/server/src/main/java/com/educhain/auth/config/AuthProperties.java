package com.educhain.auth.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("educhain.auth")
public record AuthProperties(
        @NotBlank String issuer,
        @NotBlank String audience,
        @NotNull Duration accessTokenTtl,
        @NotNull Duration refreshTokenTtl,
        @NotNull Duration passwordResetTtl,
        @NotBlank @Size(min = 32) String sessionSecret,
        boolean secureCookies,
        boolean passwordResetEmailEnabled,
        @NotBlank String passwordResetFrom,
        @NotNull URI passwordResetBaseUrl
) {
    public static final String SESSION_COOKIE = "educhain_session";
    public static final String REFRESH_COOKIE = "educhain_refresh";
}

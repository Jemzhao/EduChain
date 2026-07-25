package com.educhain.platform.security;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("educhain.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        @Min(1) int authenticationRequests,
        @Min(1) int verificationRequests,
        @Min(1) int writeRequests,
        @NotNull Duration window
) {
}

package com.educhain.evidence.config;

import com.educhain.evidence.domain.EvidenceBackendType;
import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Validated
@ConfigurationProperties("educhain.evidence")
public record EvidenceProperties(
        @NotNull URI gatewayBaseUrl,
        @NotBlank @Size(min = 32) String serviceToken,
        @NotNull EvidenceBackendType backend,
        @NotBlank @Size(min = 32) String authorPseudonymSecret,
        @NotNull Duration requestTimeout,
        @NotNull Duration pollDelay,
        @NotNull Duration retryDelay,
        @NotNull Duration leaseDuration,
        @jakarta.validation.constraints.Min(1) int maxAttempts
) {
}

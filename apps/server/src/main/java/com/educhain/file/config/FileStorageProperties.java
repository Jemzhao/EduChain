package com.educhain.file.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("educhain.file-storage")
public record FileStorageProperties(
        @NotBlank String root,
        @Positive long maxUploadBytes,
        @NotNull Duration uploadTtl
) {
}

package com.educhain.bootstrap;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("educhain.local-bootstrap")
public record LocalBootstrapProperties(
        boolean enabled,
        String adminEmail,
        String adminHandle,
        String adminDisplayName,
        String adminPassword
) {
}

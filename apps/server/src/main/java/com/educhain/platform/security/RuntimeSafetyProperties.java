package com.educhain.platform.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("educhain.runtime-safety")
public record RuntimeSafetyProperties(Environment environment) {

    public enum Environment {
        LOCAL,
        INTEGRATION,
        DEMONSTRATION,
        PRODUCTION_LIKE
    }
}

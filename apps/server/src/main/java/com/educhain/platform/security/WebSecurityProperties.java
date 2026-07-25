package com.educhain.platform.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("educhain.web-security")
public record WebSecurityProperties(List<String> allowedOrigins) {

    public WebSecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}

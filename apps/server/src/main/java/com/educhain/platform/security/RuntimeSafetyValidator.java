package com.educhain.platform.security;

import com.educhain.auth.config.AuthProperties;
import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.domain.EvidenceBackendType;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

@Component
public class RuntimeSafetyValidator implements SmartInitializingSingleton {

    private final RuntimeSafetyProperties runtime;
    private final AuthProperties auth;
    private final EvidenceProperties evidence;
    private final WebSecurityProperties webSecurity;

    public RuntimeSafetyValidator(
            RuntimeSafetyProperties runtime,
            AuthProperties auth,
            EvidenceProperties evidence,
            WebSecurityProperties webSecurity
    ) {
        this.runtime = runtime;
        this.auth = auth;
        this.evidence = evidence;
        this.webSecurity = webSecurity;
    }

    @Override
    public void afterSingletonsInstantiated() {
        if (runtime.environment() != RuntimeSafetyProperties.Environment.PRODUCTION_LIKE) {
            return;
        }
        if (!auth.secureCookies()) {
            throw new IllegalStateException("Secure cookies are required in production-like mode");
        }
        if (!auth.passwordResetEmailEnabled()) {
            throw new IllegalStateException(
                    "Password reset email delivery is required in production-like mode"
            );
        }
        if (evidence.backend() != EvidenceBackendType.CHAINMAKER) {
            throw new IllegalStateException(
                    "The evidence simulator is not allowed in production-like mode"
            );
        }
        if (webSecurity.allowedOrigins().isEmpty()
                || webSecurity.allowedOrigins().stream().anyMatch(origin -> !origin.startsWith("https://"))) {
            throw new IllegalStateException(
                    "Production-like CORS origins must be explicit HTTPS origins"
            );
        }
    }
}

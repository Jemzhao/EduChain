package com.educhain.platform.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.educhain.auth.config.AuthProperties;
import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.domain.EvidenceBackendType;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;

class RuntimeSafetyValidatorTest {

    @Test
    void localEnvironmentAllowsTheSimulatorAndInsecureDevelopmentCookies() {
        RuntimeSafetyValidator validator = new RuntimeSafetyValidator(
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.LOCAL),
                auth(false, false),
                evidence(EvidenceBackendType.SIMULATOR),
                new WebSecurityProperties(List.of("http://localhost:3000"))
        );

        assertThatCode(validator::afterSingletonsInstantiated).doesNotThrowAnyException();
    }

    @Test
    void productionLikeEnvironmentRequiresSecureOperationalSettings() {
        RuntimeSafetyValidator insecureCookies = new RuntimeSafetyValidator(
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.PRODUCTION_LIKE),
                auth(false, true),
                evidence(EvidenceBackendType.CHAINMAKER),
                new WebSecurityProperties(List.of("https://educhain.example"))
        );
        RuntimeSafetyValidator simulator = new RuntimeSafetyValidator(
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.PRODUCTION_LIKE),
                auth(true, true),
                evidence(EvidenceBackendType.SIMULATOR),
                new WebSecurityProperties(List.of("https://educhain.example"))
        );
        RuntimeSafetyValidator insecureOrigin = new RuntimeSafetyValidator(
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.PRODUCTION_LIKE),
                auth(true, true),
                evidence(EvidenceBackendType.CHAINMAKER),
                new WebSecurityProperties(List.of("http://educhain.example"))
        );

        assertThatThrownBy(insecureCookies::afterSingletonsInstantiated)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Secure cookies");
        assertThatThrownBy(simulator::afterSingletonsInstantiated)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("simulator");
        assertThatThrownBy(insecureOrigin::afterSingletonsInstantiated)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HTTPS origins");
    }

    @Test
    void productionLikeEnvironmentAcceptsTheHardenedCombination() {
        RuntimeSafetyValidator validator = new RuntimeSafetyValidator(
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.PRODUCTION_LIKE),
                auth(true, true),
                evidence(EvidenceBackendType.CHAINMAKER),
                new WebSecurityProperties(List.of("https://educhain.example"))
        );

        assertThatCode(validator::afterSingletonsInstantiated).doesNotThrowAnyException();
    }

    private AuthProperties auth(boolean secureCookies, boolean resetEmailEnabled) {
        return new AuthProperties(
                "educhain",
                "educhain-web",
                Duration.ofMinutes(15),
                Duration.ofDays(7),
                Duration.ofMinutes(30),
                "session-secret-that-is-at-least-32-characters",
                secureCookies,
                resetEmailEnabled,
                "noreply@educhain.example",
                URI.create("https://educhain.example/reset-password")
        );
    }

    private EvidenceProperties evidence(EvidenceBackendType backend) {
        return new EvidenceProperties(
                URI.create("https://evidence.educhain.example"),
                "service-token-that-is-at-least-32-characters",
                backend,
                "author-secret-that-is-at-least-32-characters",
                Duration.ofSeconds(3),
                Duration.ofSeconds(1),
                Duration.ofSeconds(1),
                Duration.ofSeconds(10),
                3
        );
    }
}

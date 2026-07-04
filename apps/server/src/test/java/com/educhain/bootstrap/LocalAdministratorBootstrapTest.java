package com.educhain.bootstrap;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.educhain.platform.security.RuntimeSafetyProperties;
import java.time.Clock;
import org.junit.jupiter.api.Test;

class LocalAdministratorBootstrapTest {

    @Test
    void refusesToRunOutsideTheLocalEnvironment() {
        LocalAdministratorBootstrap bootstrap = new LocalAdministratorBootstrap(
                new LocalBootstrapProperties(
                        true,
                        "demo@educhain.local",
                        "demo_admin",
                        "EduChain Administrator",
                        "Trustworthy!Demo"
                ),
                new RuntimeSafetyProperties(RuntimeSafetyProperties.Environment.INTEGRATION),
                null,
                null,
                null,
                null,
                null,
                Clock.systemUTC()
        );

        assertThatThrownBy(() -> bootstrap.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("only in LOCAL mode");
    }
}

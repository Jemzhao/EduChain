package com.educhain.shared.http;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class EntityTagVersionsTest {

    @Test
    void parsesOnlyQuotedNumericVersions() {
        assertThat(EntityTagVersions.parse("\"42\"")).isEqualTo(42L);

        assertThatThrownBy(() -> EntityTagVersions.parse("42"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EntityTagVersions.parse("W/\"42\""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EntityTagVersions.parse("\"version-42\""))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

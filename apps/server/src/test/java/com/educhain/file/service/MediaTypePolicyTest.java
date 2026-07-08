package com.educhain.file.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.educhain.file.domain.UploadPurpose;
import org.junit.jupiter.api.Test;

class MediaTypePolicyTest {

    private final MediaTypePolicy policy = new MediaTypePolicy();

    @Test
    void normalizesParametersAndAppliesPurposeSpecificAllowLists() {
        assertThat(policy.normalize(" Image/PNG; charset=binary ")).isEqualTo("image/png");
        assertThat(policy.accepts(UploadPurpose.RESOURCE_COVER, "image/webp")).isTrue();
        assertThat(policy.accepts(UploadPurpose.RESOURCE_COVER, "application/pdf")).isFalse();
        assertThat(policy.accepts(UploadPurpose.RESOURCE_ATTACHMENT, "text/markdown; charset=utf-8"))
                .isTrue();
        assertThat(policy.accepts(UploadPurpose.AVATAR, null)).isFalse();
    }

    @Test
    void comparesDeclaredAndDetectedSignaturesAfterNormalization() {
        assertThat(policy.signaturesAgree("IMAGE/JPEG", "image/jpeg; charset=binary")).isTrue();
        assertThat(policy.signaturesAgree("image/png", "image/jpeg")).isFalse();
    }
}

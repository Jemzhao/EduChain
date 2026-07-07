package com.educhain.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class ResourceSlugFactoryTest {

    private final ResourceSlugFactory factory = new ResourceSlugFactory();

    @Test
    void createsStableDraftAndPublishedSlugs() {
        UUID resourceId = UUID.fromString("12345678-1234-1234-1234-123456789abc");

        assertThat(factory.draftSlug(resourceId)).isEqualTo("draft-123456781234");
        assertThat(factory.publishedSlug("Distributed Systems 101", resourceId))
                .isEqualTo("distributed-systems-101-12345678");
        assertThat(factory.publishedSlug("教育知识共享", resourceId))
                .isEqualTo("knowledge-resource-12345678");
    }

    @Test
    void boundsTheReadablePartWithoutLeavingATrailingSeparator() {
        UUID resourceId = UUID.fromString("abcdefab-1234-1234-1234-123456789abc");
        String slug = factory.publishedSlug("word-".repeat(40), resourceId);

        assertThat(slug).hasSizeLessThanOrEqualTo(109);
        assertThat(slug).endsWith("-abcdefab");
        assertThat(slug).doesNotContain("--abcdefab");
    }
}

package com.educhain.evidence.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.platform.contract.EvidenceAttachmentSnapshot;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EvidenceCryptographyTest {

    private final EvidenceCryptography cryptography = new EvidenceCryptography(properties());

    @Test
    void createsStableNonReversiblePseudonymsWithinSeparateNamespaces() {
        UUID authorId = UUID.fromString("12345678-1234-1234-1234-123456789abc");

        assertThat(cryptography.authorProofId(authorId))
                .hasSize(64)
                .isEqualTo(cryptography.authorProofId(authorId));
        assertThat(cryptography.callerPseudonym(authorId.toString()))
                .isNotEqualTo(cryptography.authorProofId(authorId));
        assertThat(cryptography.callerPseudonym(" ")).isNull();
    }

    @Test
    void merkleRootIsOrderedBySortPositionAndChangesWithContent() {
        EvidenceAttachmentSnapshot first = new EvidenceAttachmentSnapshot(1, "PRIMARY", "a".repeat(64));
        EvidenceAttachmentSnapshot second = new EvidenceAttachmentSnapshot(2, "SUPPLEMENT", "b".repeat(64));
        EvidenceAttachmentSnapshot changed = new EvidenceAttachmentSnapshot(2, "SUPPLEMENT", "c".repeat(64));

        String root = cryptography.attachmentMerkleRoot(List.of(second, first));

        assertThat(root).hasSize(64);
        assertThat(root).isEqualTo(cryptography.attachmentMerkleRoot(List.of(first, second)));
        assertThat(root).isNotEqualTo(cryptography.attachmentMerkleRoot(List.of(first, changed)));
        assertThat(cryptography.attachmentMerkleRoot(List.of())).isNull();
    }

    private EvidenceProperties properties() {
        return new EvidenceProperties(
                URI.create("http://localhost:8081"),
                "service-token-that-is-at-least-32-characters",
                EvidenceBackendType.SIMULATOR,
                "author-secret-that-is-at-least-32-characters",
                Duration.ofSeconds(3),
                Duration.ofSeconds(1),
                Duration.ofSeconds(1),
                Duration.ofSeconds(10),
                3
        );
    }
}

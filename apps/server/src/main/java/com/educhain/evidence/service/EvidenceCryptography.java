package com.educhain.evidence.service;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.platform.contract.EvidenceAttachmentSnapshot;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class EvidenceCryptography {

    private final byte[] authorSecret;

    public EvidenceCryptography(EvidenceProperties properties) {
        this.authorSecret = properties.authorPseudonymSecret().getBytes(StandardCharsets.UTF_8);
    }

    public String authorProofId(UUID authorId) {
        return pseudonym("educhain-author:v1:" + authorId);
    }

    public String callerPseudonym(String source) {
        return source == null || source.isBlank()
                ? null
                : pseudonym("educhain-verification-caller:v1:" + source);
    }

    private String pseudonym(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(authorSecret, "HmacSHA256"));
            return HexFormat.of().formatHex(
                    mac.doFinal(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA-256 is unavailable", exception);
        }
    }

    public String attachmentMerkleRoot(List<EvidenceAttachmentSnapshot> attachments) {
        if (attachments.isEmpty()) return null;
        List<byte[]> level = attachments.stream()
                .sorted(Comparator.comparingInt(EvidenceAttachmentSnapshot::sortOrder))
                .map(attachment -> sha256(String.join(
                        ":",
                        Integer.toString(attachment.sortOrder()),
                        attachment.purpose(),
                        attachment.sha256()
                ).getBytes(StandardCharsets.UTF_8)))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        while (level.size() > 1) {
            if (level.size() % 2 == 1) level.add(level.getLast());
            List<byte[]> next = new ArrayList<>(level.size() / 2);
            for (int index = 0; index < level.size(); index += 2) {
                byte[] combined = new byte[level.get(index).length + level.get(index + 1).length];
                System.arraycopy(level.get(index), 0, combined, 0, level.get(index).length);
                System.arraycopy(
                        level.get(index + 1),
                        0,
                        combined,
                        level.get(index).length,
                        level.get(index + 1).length
                );
                next.add(sha256(combined));
            }
            level = next;
        }
        return HexFormat.of().formatHex(level.getFirst());
    }

    private byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}

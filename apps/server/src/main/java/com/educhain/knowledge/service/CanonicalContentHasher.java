package com.educhain.knowledge.service;

import com.educhain.file.service.FileSnapshot;
import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class CanonicalContentHasher {

    public String digest(
            UUID resourceId,
            KnowledgeDraftEntity draft,
            List<UUID> tagIds,
            FileSnapshot cover,
            List<KnowledgeDraftFileEntity> attachments,
            Map<UUID, FileSnapshot> files
    ) {
        StringBuilder canonical = new StringBuilder();
        append(canonical, "schema", "v2");
        append(canonical, "resource", resourceId.toString());
        append(canonical, "title", normalize(draft.getTitle()));
        append(canonical, "summary", normalize(draft.getSummary()));
        append(canonical, "body", normalize(draft.getBodyContent()));
        append(canonical, "type", draft.getResourceType().name());
        append(canonical, "source", normalize(draft.getSourceUrl()));
        append(canonical, "category", draft.getCategoryId().toString());
        append(canonical, "copyright", normalize(draft.getCopyrightStatement()));
        append(canonical, "cover", cover == null ? "" : cover.sha256());
        for (int index = 0; index < tagIds.size(); index++) {
            append(canonical, "tag." + index, tagIds.get(index).toString());
        }
        for (KnowledgeDraftFileEntity attachment : attachments) {
            FileSnapshot file = files.get(attachment.getFileId());
            append(
                    canonical,
                    "file." + attachment.getSortOrder(),
                    String.join(
                            "|",
                            attachment.getFileId().toString(),
                            normalize(attachment.getDisplayName()),
                            attachment.getPurpose().name(),
                            file.sha256()
                    )
            );
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(canonical.toString().getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private void append(StringBuilder target, String key, String value) {
        target.append(key)
                .append(':')
                .append(value.getBytes(StandardCharsets.UTF_8).length)
                .append(':')
                .append(value)
                .append('\n');
    }

    private String normalize(String value) {
        return Normalizer.normalize(value.replace("\r\n", "\n").replace('\r', '\n'), Normalizer.Form.NFC);
    }
}

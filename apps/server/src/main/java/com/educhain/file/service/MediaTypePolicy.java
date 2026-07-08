package com.educhain.file.service;

import com.educhain.file.domain.UploadPurpose;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class MediaTypePolicy {

    private static final Set<String> IMAGES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ATTACHMENTS = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "text/plain",
            "text/markdown"
    );
    private static final Map<UploadPurpose, Set<String>> ALLOWED = Map.of(
            UploadPurpose.RESOURCE_ATTACHMENT, ATTACHMENTS,
            UploadPurpose.RESOURCE_COVER, IMAGES,
            UploadPurpose.AVATAR, IMAGES,
            UploadPurpose.VERIFICATION, ATTACHMENTS
    );

    public boolean accepts(UploadPurpose purpose, String mediaType) {
        return ALLOWED.getOrDefault(purpose, Set.of()).contains(normalize(mediaType));
    }

    public boolean signaturesAgree(String declaredMediaType, String detectedMediaType) {
        return normalize(declaredMediaType).equals(normalize(detectedMediaType));
    }

    public String normalize(String mediaType) {
        return mediaType == null ? "" : mediaType.split(";", 2)[0].trim().toLowerCase();
    }
}

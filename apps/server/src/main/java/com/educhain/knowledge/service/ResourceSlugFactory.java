package com.educhain.knowledge.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ResourceSlugFactory {

    public String draftSlug(UUID resourceId) {
        return "draft-" + compact(resourceId, 12);
    }

    public String publishedSlug(String title, UUID resourceId) {
        String ascii = Normalizer.normalize(title, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        String base = ascii.isBlank() ? "knowledge-resource" : ascii;
        if (base.length() > 100) {
            base = base.substring(0, 100).replaceAll("-$", "");
        }
        return base + "-" + compact(resourceId, 8);
    }

    private String compact(UUID id, int length) {
        return id.toString().replace("-", "").substring(0, length);
    }
}

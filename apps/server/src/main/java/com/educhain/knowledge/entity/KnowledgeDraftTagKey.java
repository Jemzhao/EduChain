package com.educhain.knowledge.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class KnowledgeDraftTagKey implements Serializable {
    private UUID resourceId;
    private UUID tagId;

    public KnowledgeDraftTagKey() {
    }

    public KnowledgeDraftTagKey(UUID resourceId, UUID tagId) {
        this.resourceId = resourceId;
        this.tagId = tagId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof KnowledgeDraftTagKey that)) return false;
        return Objects.equals(resourceId, that.resourceId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(resourceId, tagId);
    }
}

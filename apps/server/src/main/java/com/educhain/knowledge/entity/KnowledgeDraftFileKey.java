package com.educhain.knowledge.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class KnowledgeDraftFileKey implements Serializable {
    private UUID resourceId;
    private UUID fileId;

    public KnowledgeDraftFileKey() {
    }

    public KnowledgeDraftFileKey(UUID resourceId, UUID fileId) {
        this.resourceId = resourceId;
        this.fileId = fileId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof KnowledgeDraftFileKey that)) return false;
        return Objects.equals(resourceId, that.resourceId) && Objects.equals(fileId, that.fileId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(resourceId, fileId);
    }
}

package com.educhain.knowledge.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class KnowledgeVersionTagKey implements Serializable {
    private UUID versionId;
    private UUID tagId;

    public KnowledgeVersionTagKey() {
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof KnowledgeVersionTagKey that)) return false;
        return Objects.equals(versionId, that.versionId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(versionId, tagId);
    }
}

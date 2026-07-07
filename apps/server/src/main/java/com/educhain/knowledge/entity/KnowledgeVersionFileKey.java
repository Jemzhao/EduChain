package com.educhain.knowledge.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class KnowledgeVersionFileKey implements Serializable {
    private UUID versionId;
    private UUID fileId;

    public KnowledgeVersionFileKey() {
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof KnowledgeVersionFileKey that)) return false;
        return Objects.equals(versionId, that.versionId) && Objects.equals(fileId, that.fileId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(versionId, fileId);
    }
}

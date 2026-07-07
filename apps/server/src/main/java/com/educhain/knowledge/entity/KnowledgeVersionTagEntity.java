package com.educhain.knowledge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@IdClass(KnowledgeVersionTagKey.class)
@Table(name = "knowledge_version_tag")
public class KnowledgeVersionTagEntity {

    @Id
    @Column(name = "version_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID versionId;

    @Id
    @Column(name = "tag_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID tagId;

    @Column(name = "sort_order", nullable = false, updatable = false)
    private int sortOrder;

    protected KnowledgeVersionTagEntity() {
    }

    public KnowledgeVersionTagEntity(UUID versionId, UUID tagId, int sortOrder) {
        this.versionId = versionId;
        this.tagId = tagId;
        this.sortOrder = sortOrder;
    }

    public UUID getTagId() {
        return tagId;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}

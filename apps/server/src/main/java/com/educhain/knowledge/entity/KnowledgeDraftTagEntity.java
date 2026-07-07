package com.educhain.knowledge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@IdClass(KnowledgeDraftTagKey.class)
@Table(name = "knowledge_draft_tag")
public class KnowledgeDraftTagEntity {

    @Id
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Id
    @Column(name = "tag_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID tagId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected KnowledgeDraftTagEntity() {
    }

    public KnowledgeDraftTagEntity(UUID resourceId, UUID tagId, int sortOrder) {
        this.resourceId = resourceId;
        this.tagId = tagId;
        this.sortOrder = sortOrder;
    }

    public UUID getTagId() {
        return tagId;
    }
}

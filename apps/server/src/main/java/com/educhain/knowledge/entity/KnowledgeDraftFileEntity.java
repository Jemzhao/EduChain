package com.educhain.knowledge.entity;

import com.educhain.knowledge.domain.DraftFilePurpose;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@IdClass(KnowledgeDraftFileKey.class)
@Table(name = "knowledge_draft_file")
public class KnowledgeDraftFileEntity {

    @Id
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Id
    @Column(name = "file_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID fileId;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 24)
    private DraftFilePurpose purpose;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected KnowledgeDraftFileEntity() {
    }

    public KnowledgeDraftFileEntity(
            UUID resourceId,
            UUID fileId,
            String displayName,
            DraftFilePurpose purpose,
            int sortOrder
    ) {
        this.resourceId = resourceId;
        this.fileId = fileId;
        this.displayName = displayName;
        this.purpose = purpose;
        this.sortOrder = sortOrder;
    }

    public UUID getFileId() {
        return fileId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public DraftFilePurpose getPurpose() {
        return purpose;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}

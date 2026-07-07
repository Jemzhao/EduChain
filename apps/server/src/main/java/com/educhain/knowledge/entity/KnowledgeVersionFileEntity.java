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
@IdClass(KnowledgeVersionFileKey.class)
@Table(name = "knowledge_version_file")
public class KnowledgeVersionFileEntity {

    @Id
    @Column(name = "version_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID versionId;

    @Id
    @Column(name = "file_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID fileId;

    @Column(name = "display_name", nullable = false, updatable = false, length = 255)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, updatable = false, length = 24)
    private DraftFilePurpose purpose;

    @Column(name = "sort_order", nullable = false, updatable = false)
    private int sortOrder;

    @Column(name = "sha256_at_publication", nullable = false, updatable = false, length = 64)
    private String sha256AtPublication;

    protected KnowledgeVersionFileEntity() {
    }

    public KnowledgeVersionFileEntity(
            UUID versionId,
            UUID fileId,
            String displayName,
            DraftFilePurpose purpose,
            int sortOrder,
            String sha256AtPublication
    ) {
        this.versionId = versionId;
        this.fileId = fileId;
        this.displayName = displayName;
        this.purpose = purpose;
        this.sortOrder = sortOrder;
        this.sha256AtPublication = sha256AtPublication;
    }

    public UUID getFileId() {
        return fileId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSha256AtPublication() {
        return sha256AtPublication;
    }

    public DraftFilePurpose getPurpose() {
        return purpose;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}

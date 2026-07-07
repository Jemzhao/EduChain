package com.educhain.knowledge.entity;

import com.educhain.knowledge.domain.ResourceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "knowledge_draft")
public class KnowledgeDraftEntity {

    @Id
    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "summary", nullable = false, length = 600)
    private String summary;

    @Column(name = "body_content", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String bodyContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 24)
    private ResourceType resourceType;

    @Column(name = "source_url", nullable = false, length = 2048)
    private String sourceUrl;

    @Column(name = "category_id", columnDefinition = "BINARY(16)")
    private UUID categoryId;

    @Column(name = "cover_file_id", columnDefinition = "BINARY(16)")
    private UUID coverFileId;

    @Column(name = "copyright_statement", nullable = false, length = 500)
    private String copyrightStatement;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected KnowledgeDraftEntity() {
    }

    public KnowledgeDraftEntity(UUID resourceId, String title, ResourceType resourceType, Instant savedAt) {
        this.resourceId = resourceId;
        this.title = title;
        this.summary = "";
        this.bodyContent = "";
        this.resourceType = resourceType;
        this.sourceUrl = "";
        this.copyrightStatement = "";
        this.savedAt = savedAt;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getBodyContent() {
        return bodyContent;
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getCoverFileId() {
        return coverFileId;
    }

    public String getCopyrightStatement() {
        return copyrightStatement;
    }

    public long getVersion() {
        return version;
    }

    public Instant getSavedAt() {
        return savedAt;
    }

    public void update(
            String title,
            String summary,
            String bodyContent,
            String sourceUrl,
            UUID categoryId,
            UUID coverFileId,
            String copyrightStatement,
            Instant savedAt
    ) {
        this.title = title;
        this.summary = summary;
        this.bodyContent = bodyContent;
        this.sourceUrl = sourceUrl;
        this.categoryId = categoryId;
        this.coverFileId = coverFileId;
        this.copyrightStatement = copyrightStatement;
        this.savedAt = savedAt;
    }
}

package com.educhain.knowledge.entity;

import com.educhain.knowledge.domain.ResourceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "knowledge_version")
public class KnowledgeVersionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "resource_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID resourceId;

    @Column(name = "version_number", nullable = false, updatable = false)
    private int versionNumber;

    @Column(name = "title", nullable = false, updatable = false, length = 160)
    private String title;

    @Column(name = "summary", nullable = false, updatable = false, length = 600)
    private String summary;

    @Column(name = "body_content", nullable = false, updatable = false, columnDefinition = "MEDIUMTEXT")
    private String bodyContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, updatable = false, length = 24)
    private ResourceType resourceType;

    @Column(name = "source_url", nullable = false, updatable = false, length = 2048)
    private String sourceUrl;

    @Column(name = "category_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID categoryId;

    @Column(name = "cover_file_id", updatable = false, columnDefinition = "BINARY(16)")
    private UUID coverFileId;

    @Column(name = "copyright_statement", nullable = false, updatable = false, length = 500)
    private String copyrightStatement;

    @Column(name = "publisher_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID publisherId;

    @Column(name = "content_schema_version", nullable = false, updatable = false, length = 24)
    private String contentSchemaVersion;

    @Column(name = "content_digest", nullable = false, updatable = false, length = 64)
    private String contentDigest;

    @Column(name = "reading_minutes", nullable = false, updatable = false)
    private int readingMinutes;

    @Column(name = "published_at", nullable = false, updatable = false)
    private Instant publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected KnowledgeVersionEntity() {
    }

    public KnowledgeVersionEntity(
            UUID id,
            UUID resourceId,
            int versionNumber,
            String title,
            String summary,
            String bodyContent,
            ResourceType resourceType,
            String sourceUrl,
            UUID categoryId,
            UUID coverFileId,
            String copyrightStatement,
            UUID publisherId,
            String contentDigest,
            int readingMinutes,
            Instant publishedAt
    ) {
        this.id = id;
        this.resourceId = resourceId;
        this.versionNumber = versionNumber;
        this.title = title;
        this.summary = summary;
        this.bodyContent = bodyContent;
        this.resourceType = resourceType;
        this.sourceUrl = sourceUrl;
        this.categoryId = categoryId;
        this.coverFileId = coverFileId;
        this.copyrightStatement = copyrightStatement;
        this.publisherId = publisherId;
        this.contentSchemaVersion = "v2";
        this.contentDigest = contentDigest;
        this.readingMinutes = readingMinutes;
        this.publishedAt = publishedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public int getVersionNumber() {
        return versionNumber;
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

    public UUID getPublisherId() {
        return publisherId;
    }

    public String getContentDigest() {
        return contentDigest;
    }

    public String getContentSchemaVersion() {
        return contentSchemaVersion;
    }

    public int getReadingMinutes() {
        return readingMinutes;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }
}

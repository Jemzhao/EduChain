package com.educhain.externalcontent.entity;

import com.educhain.externalcontent.domain.ExternalQualityStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "external_content_item")
public class ExternalContentItemEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id", nullable = false, updatable = false)
    private ExternalContentSourceEntity source;
    @Column(name = "external_key", nullable = false, length = 200)
    private String externalKey;
    @Column(name = "canonical_url", nullable = false, length = 2048)
    private String canonicalUrl;
    @Column(name = "url_digest", nullable = false, updatable = false, length = 64)
    private String urlDigest;
    @Column(name = "title", nullable = false, length = 240)
    private String title;
    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;
    @Column(name = "author_name", nullable = false, length = 160)
    private String authorName;
    @Enumerated(EnumType.STRING)
    @Column(name = "quality_status", nullable = false, length = 24)
    private ExternalQualityStatus qualityStatus;
    @Column(name = "published_at")
    private Instant publishedAt;
    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;
    @Version
    @Column(name = "version", nullable = false)
    private long version;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExternalContentItemEntity() {
    }

    public ExternalContentItemEntity(
            UUID id,
            ExternalContentSourceEntity source,
            String externalKey,
            String canonicalUrl,
            String urlDigest,
            String title,
            String summary,
            String authorName,
            Instant publishedAt,
            Instant fetchedAt
    ) {
        this.id = id;
        this.source = source;
        this.externalKey = externalKey;
        this.canonicalUrl = canonicalUrl;
        this.urlDigest = urlDigest;
        this.title = title;
        this.summary = summary;
        this.authorName = authorName;
        this.qualityStatus = ExternalQualityStatus.PENDING;
        this.publishedAt = publishedAt;
        this.fetchedAt = fetchedAt;
    }

    public UUID getId() { return id; }
    public ExternalContentSourceEntity getSource() { return source; }
    public String getExternalKey() { return externalKey; }
    public String getCanonicalUrl() { return canonicalUrl; }
    public String getUrlDigest() { return urlDigest; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getAuthorName() { return authorName; }
    public ExternalQualityStatus getQualityStatus() { return qualityStatus; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getFetchedAt() { return fetchedAt; }
    public long getVersion() { return version; }

    public void refresh(
            String externalKey,
            String canonicalUrl,
            String title,
            String summary,
            String authorName,
            Instant publishedAt,
            Instant fetchedAt
    ) {
        this.externalKey = externalKey;
        this.canonicalUrl = canonicalUrl;
        this.title = title;
        this.summary = summary;
        this.authorName = authorName;
        this.publishedAt = publishedAt;
        this.fetchedAt = fetchedAt;
        if (qualityStatus == ExternalQualityStatus.REJECTED) qualityStatus = ExternalQualityStatus.PENDING;
    }

    public void review(ExternalQualityStatus status) {
        this.qualityStatus = status;
    }
}

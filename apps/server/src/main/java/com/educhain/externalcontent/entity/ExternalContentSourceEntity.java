package com.educhain.externalcontent.entity;

import com.educhain.externalcontent.domain.ExternalSyncStatus;

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
@Table(name = "external_content_source")
public class ExternalContentSourceEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;
    @Column(name = "name", nullable = false, length = 120)
    private String name;
    @Column(name = "site_url", nullable = false, length = 2048)
    private String siteUrl;
    @Column(name = "feed_url", nullable = false, length = 2048)
    private String feedUrl;
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 24)
    private ExternalSyncStatus syncStatus;
    @Column(name = "last_sync_error", length = 80)
    private String lastSyncError;
    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;
    @Version
    @Column(name = "version", nullable = false)
    private long version;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExternalContentSourceEntity() {
    }

    public ExternalContentSourceEntity(UUID id, String name, String siteUrl, String feedUrl) {
        this.id = id;
        this.name = name;
        this.siteUrl = siteUrl;
        this.feedUrl = feedUrl;
        this.enabled = true;
        this.syncStatus = ExternalSyncStatus.NEVER_SYNCED;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSiteUrl() { return siteUrl; }
    public String getFeedUrl() { return feedUrl; }
    public boolean isEnabled() { return enabled; }
    public ExternalSyncStatus getSyncStatus() { return syncStatus; }
    public String getLastSyncError() { return lastSyncError; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String name, String siteUrl, String feedUrl, boolean enabled) {
        this.name = name;
        this.siteUrl = siteUrl;
        this.feedUrl = feedUrl;
        this.enabled = enabled;
    }

    public void beginSync() {
        this.syncStatus = ExternalSyncStatus.RUNNING;
        this.lastSyncError = null;
    }

    public void completeSync(Instant completedAt) {
        this.syncStatus = ExternalSyncStatus.SUCCEEDED;
        this.lastSyncError = null;
        this.lastSyncedAt = completedAt;
    }

    public void failSync(String errorCode, Instant completedAt) {
        this.syncStatus = ExternalSyncStatus.FAILED;
        this.lastSyncError = errorCode;
        this.lastSyncedAt = completedAt;
    }
}

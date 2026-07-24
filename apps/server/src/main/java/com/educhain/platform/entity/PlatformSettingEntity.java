package com.educhain.platform.entity;

import com.educhain.platform.domain.PlatformSettingType;

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
@Table(name = "platform_setting")
public class PlatformSettingEntity {

    @Id
    @Column(name = "setting_key", nullable = false, updatable = false, length = 100)
    private String key;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false, updatable = false, length = 24)
    private PlatformSettingType type;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String value;

    @Column(name = "public_visible", nullable = false, updatable = false)
    private boolean publicVisible;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "updated_by", columnDefinition = "BINARY(16)")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PlatformSettingEntity() {
    }

    public String getKey() { return key; }
    public PlatformSettingType getType() { return type; }
    public String getValue() { return value; }
    public boolean isPublicVisible() { return publicVisible; }
    public long getVersion() { return version; }
    public UUID getUpdatedBy() { return updatedBy; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String value, UUID actorId) {
        this.value = value;
        this.updatedBy = actorId;
    }
}

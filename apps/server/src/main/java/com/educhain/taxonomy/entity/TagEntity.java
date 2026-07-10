package com.educhain.taxonomy.entity;

import com.educhain.taxonomy.domain.TaxonomyStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;

@Entity
@Table(name = "tag")
public class TagEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "slug", nullable = false, length = 80)
    private String slug;

    @Column(name = "canonical_name", nullable = false, length = 80)
    private String canonicalName;

    @Column(name = "description", nullable = false, length = 240)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private TaxonomyStatus status;

    @Column(name = "merged_into_id", columnDefinition = "BINARY(16)")
    private UUID mergedIntoId;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected TagEntity() {
    }

    public TagEntity(UUID id, String slug, String name, String description) {
        this.id = id;
        this.slug = slug;
        this.canonicalName = name;
        this.description = description;
        this.status = TaxonomyStatus.ACTIVE;
    }

    public UUID getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getCanonicalName() {
        return canonicalName;
    }

    public String getDescription() {
        return description;
    }

    public TaxonomyStatus getStatus() {
        return status;
    }

    public long getVersion() {
        return version;
    }

    public UUID getMergedIntoId() {
        return mergedIntoId;
    }

    public void changeStatus(TaxonomyStatus status) {
        this.status = status;
    }

    public void mergeInto(UUID targetId) {
        this.mergedIntoId = targetId;
        this.status = TaxonomyStatus.DISABLED;
    }

    public void update(String slug, String name, String description) {
        this.slug = slug;
        this.canonicalName = name;
        this.description = description;
    }
}

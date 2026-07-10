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
@Table(name = "category")
public class CategoryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "parent_id", columnDefinition = "BINARY(16)")
    private UUID parentId;

    @Column(name = "slug", nullable = false, length = 80)
    private String slug;

    @Column(name = "name_key", nullable = false, length = 120)
    private String nameKey;

    @Column(name = "description_key", nullable = false, length = 120)
    private String descriptionKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private TaxonomyStatus status;

    @Column(name = "merged_into_id", columnDefinition = "BINARY(16)")
    private UUID mergedIntoId;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected CategoryEntity() {
    }

    public CategoryEntity(
            UUID id,
            UUID parentId,
            String slug,
            String label,
            String description,
            int sortOrder
    ) {
        this.id = id;
        this.parentId = parentId;
        this.slug = slug;
        this.nameKey = label;
        this.descriptionKey = description;
        this.sortOrder = sortOrder;
        this.status = TaxonomyStatus.ACTIVE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getParentId() {
        return parentId;
    }

    public String getSlug() {
        return slug;
    }

    public String getNameKey() {
        return nameKey;
    }

    public String getDescriptionKey() {
        return descriptionKey;
    }

    public int getSortOrder() {
        return sortOrder;
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

    public void update(
            UUID parentId,
            String slug,
            String label,
            String description,
            int sortOrder
    ) {
        this.parentId = parentId;
        this.slug = slug;
        this.nameKey = label;
        this.descriptionKey = description;
        this.sortOrder = sortOrder;
    }
}

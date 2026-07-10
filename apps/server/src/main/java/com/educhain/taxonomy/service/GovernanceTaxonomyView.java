package com.educhain.taxonomy.service;

import com.educhain.taxonomy.domain.TaxonomyStatus;
import java.util.UUID;

public record GovernanceTaxonomyView(
        UUID id,
        String kind,
        String slug,
        String label,
        String description,
        UUID parentId,
        Integer sortOrder,
        TaxonomyStatus status,
        UUID mergedIntoId,
        long version,
        long referenceCount
) {
}

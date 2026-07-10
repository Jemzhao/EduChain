package com.educhain.taxonomy.repository;

import com.educhain.taxonomy.entity.TagEntity;
import com.educhain.taxonomy.domain.TaxonomyStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<TagEntity, UUID> {

    List<TagEntity> findAllByStatusAndCanonicalNameContainingIgnoreCaseOrderByCanonicalNameAsc(
            TaxonomyStatus status,
            String query,
            Pageable pageable
    );

    List<TagEntity> findAllByIdInAndStatus(Collection<UUID> ids, TaxonomyStatus status);

    Optional<TagEntity> findBySlugAndStatus(String slug, TaxonomyStatus status);

    List<TagEntity> findAllByOrderByCanonicalNameAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}

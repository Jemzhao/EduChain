package com.educhain.taxonomy.repository;

import com.educhain.taxonomy.entity.CategoryEntity;
import com.educhain.taxonomy.domain.TaxonomyStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    List<CategoryEntity> findAllByStatusOrderBySortOrderAsc(TaxonomyStatus status);

    Optional<CategoryEntity> findByIdAndStatus(UUID id, TaxonomyStatus status);

    Optional<CategoryEntity> findBySlugAndStatus(String slug, TaxonomyStatus status);

    List<CategoryEntity> findAllByOrderBySortOrderAscSlugAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    boolean existsByParentId(UUID parentId);
}

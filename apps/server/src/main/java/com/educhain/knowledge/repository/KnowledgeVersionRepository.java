package com.educhain.knowledge.repository;

import com.educhain.knowledge.domain.ResourceStatus;

import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeVersionRepository extends JpaRepository<KnowledgeVersionEntity, UUID> {

    long countByResourceId(UUID resourceId);

    long countByCategoryId(UUID categoryId);

    Optional<KnowledgeVersionEntity> findFirstByResourceIdOrderByVersionNumberDesc(UUID resourceId);

    Optional<KnowledgeVersionEntity> findByIdAndResourceId(UUID id, UUID resourceId);

    List<KnowledgeVersionEntity> findAllByResourceIdOrderByVersionNumberDesc(UUID resourceId);

    @Query("""
            select (count(version) > 0)
            from KnowledgeVersionEntity version, KnowledgeResourceEntity resource
            where version.coverFileId = :fileId
              and version.resourceId = resource.id
              and resource.status = com.educhain.knowledge.domain.ResourceStatus.PUBLISHED
            """)
    boolean existsPublishedCover(@Param("fileId") UUID fileId);

    @Query("""
            select version
            from KnowledgeVersionEntity version, KnowledgeResourceEntity resource
            where resource.currentPublicVersionId = version.id
              and resource.status = com.educhain.knowledge.domain.ResourceStatus.PUBLISHED
            """)
    Page<KnowledgeVersionEntity> findCurrentPublished(Pageable pageable);
}

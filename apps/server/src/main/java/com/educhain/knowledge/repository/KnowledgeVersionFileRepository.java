package com.educhain.knowledge.repository;

import com.educhain.knowledge.domain.ResourceStatus;

import com.educhain.knowledge.entity.KnowledgeVersionFileEntity;
import com.educhain.knowledge.entity.KnowledgeVersionFileKey;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeVersionFileRepository extends JpaRepository<KnowledgeVersionFileEntity, KnowledgeVersionFileKey> {

    List<KnowledgeVersionFileEntity> findAllByVersionIdOrderBySortOrderAsc(UUID versionId);

    @Query("""
            select (count(file) > 0)
            from KnowledgeVersionFileEntity file,
                 KnowledgeVersionEntity version,
                 KnowledgeResourceEntity resource
            where file.fileId = :fileId
              and file.versionId = version.id
              and version.resourceId = resource.id
              and resource.status = com.educhain.knowledge.domain.ResourceStatus.PUBLISHED
            """)
    boolean existsInPublishedResource(@Param("fileId") UUID fileId);
}

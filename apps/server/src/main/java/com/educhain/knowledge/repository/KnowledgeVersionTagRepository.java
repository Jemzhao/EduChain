package com.educhain.knowledge.repository;

import com.educhain.knowledge.entity.KnowledgeVersionTagEntity;
import com.educhain.knowledge.entity.KnowledgeVersionTagKey;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeVersionTagRepository extends JpaRepository<KnowledgeVersionTagEntity, KnowledgeVersionTagKey> {

    List<KnowledgeVersionTagEntity> findAllByVersionIdOrderBySortOrderAsc(UUID versionId);

    List<KnowledgeVersionTagEntity> findAllByVersionIdIn(Collection<UUID> versionIds);

    long countByTagId(UUID tagId);
}

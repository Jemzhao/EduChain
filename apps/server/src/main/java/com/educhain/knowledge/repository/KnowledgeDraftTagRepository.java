package com.educhain.knowledge.repository;

import com.educhain.knowledge.entity.KnowledgeDraftTagEntity;
import com.educhain.knowledge.entity.KnowledgeDraftTagKey;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeDraftTagRepository extends JpaRepository<KnowledgeDraftTagEntity, KnowledgeDraftTagKey> {

    List<KnowledgeDraftTagEntity> findAllByResourceIdOrderBySortOrderAsc(UUID resourceId);

    void deleteAllByResourceId(UUID resourceId);
}

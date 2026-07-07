package com.educhain.knowledge.repository;

import com.educhain.knowledge.entity.KnowledgeDraftFileEntity;
import com.educhain.knowledge.entity.KnowledgeDraftFileKey;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeDraftFileRepository extends JpaRepository<KnowledgeDraftFileEntity, KnowledgeDraftFileKey> {

    List<KnowledgeDraftFileEntity> findAllByResourceIdOrderBySortOrderAsc(UUID resourceId);

    void deleteAllByResourceId(UUID resourceId);
}

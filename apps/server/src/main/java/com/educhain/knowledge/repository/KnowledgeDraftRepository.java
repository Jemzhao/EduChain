package com.educhain.knowledge.repository;

import com.educhain.knowledge.entity.KnowledgeDraftEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeDraftRepository extends JpaRepository<KnowledgeDraftEntity, UUID> {
}

package com.educhain.knowledge.repository;

import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface KnowledgeResourceRepository extends JpaRepository<KnowledgeResourceEntity, UUID> {

    Optional<KnowledgeResourceEntity> findByIdAndAuthorId(UUID id, UUID authorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<KnowledgeResourceEntity> findLockedByIdAndAuthorId(UUID id, UUID authorId);

    Optional<KnowledgeResourceEntity> findByPublicSlug(String publicSlug);

    List<KnowledgeResourceEntity> findAllByAuthorIdOrderByUpdatedAtDesc(UUID authorId);

    Page<KnowledgeResourceEntity> findAllByStatus(ResourceStatus status, Pageable pageable);

    long countByAuthorIdAndStatus(UUID authorId, ResourceStatus status);

    long countByStatus(ResourceStatus status);
}

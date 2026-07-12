package com.educhain.discovery.repository;

import com.educhain.discovery.entity.ResourceViewEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceViewRepository extends JpaRepository<ResourceViewEntity, UUID> {
    Optional<ResourceViewEntity> findByResourceIdAndViewerKey(UUID resourceId, String viewerKey);

    long countByResourceId(UUID resourceId);

    List<ResourceViewEntity> findAllByUserIdOrderByLastViewedAtDesc(UUID userId, Pageable pageable);

    void deleteAllByUserId(UUID userId);
}

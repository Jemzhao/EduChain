package com.educhain.interaction.repository;

import com.educhain.interaction.entity.CollectionEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionRepository extends JpaRepository<CollectionEntity, UUID> {

    Optional<CollectionEntity> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<CollectionEntity> findByOwnerIdAndDefaultCollectionTrue(UUID ownerId);

    List<CollectionEntity> findAllByOwnerIdOrderByDefaultCollectionDescCreatedAtAsc(UUID ownerId);

    boolean existsByOwnerIdAndNameNormalized(UUID ownerId, String nameNormalized);

    boolean existsByOwnerIdAndNameNormalizedAndIdNot(
            UUID ownerId,
            String nameNormalized,
            UUID id
    );
}

package com.educhain.interaction.repository;

import com.educhain.interaction.entity.CollectionItemEntity;
import com.educhain.interaction.entity.CollectionItemKey;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CollectionItemRepository
        extends JpaRepository<CollectionItemEntity, CollectionItemKey> {

    boolean existsByCollectionIdAndResourceId(UUID collectionId, UUID resourceId);

    long countByCollectionId(UUID collectionId);

    long countByResourceId(UUID resourceId);

    Page<CollectionItemEntity> findAllByCollectionId(UUID collectionId, Pageable pageable);

    void deleteByCollectionIdAndResourceId(UUID collectionId, UUID resourceId);

    @Query("""
            select item.resourceId as resourceId, count(item) as total
              from CollectionItemEntity item
             where item.resourceId in :resourceIds
             group by item.resourceId
            """)
    java.util.List<ResourceCountProjection> countGroupedByResourceId(
            @Param("resourceIds") java.util.Collection<UUID> resourceIds
    );
}

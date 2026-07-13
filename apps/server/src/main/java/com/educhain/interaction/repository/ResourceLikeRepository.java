package com.educhain.interaction.repository;

import com.educhain.interaction.entity.ResourceLikeEntity;
import com.educhain.interaction.entity.ResourceLikeKey;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResourceLikeRepository extends JpaRepository<ResourceLikeEntity, ResourceLikeKey> {

    boolean existsByUserIdAndResourceId(UUID userId, UUID resourceId);

    long countByResourceId(UUID resourceId);

    @Query("""
            select count(resourceLike)
              from ResourceLikeEntity resourceLike, KnowledgeResourceEntity resource
             where resourceLike.resourceId = resource.id
               and resource.authorId = :authorId
            """)
    long countReceivedByAuthorId(@Param("authorId") UUID authorId);

    void deleteByUserIdAndResourceId(UUID userId, UUID resourceId);

    @Query("""
            select resourceLike.resourceId as resourceId, count(resourceLike) as total
              from ResourceLikeEntity resourceLike
             where resourceLike.resourceId in :resourceIds
             group by resourceLike.resourceId
            """)
    java.util.List<ResourceCountProjection> countGroupedByResourceId(
            @Param("resourceIds") java.util.Collection<UUID> resourceIds
    );
}

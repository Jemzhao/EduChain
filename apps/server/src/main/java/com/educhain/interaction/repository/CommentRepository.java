package com.educhain.interaction.repository;

import com.educhain.interaction.entity.CommentEntity;
import com.educhain.interaction.domain.CommentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<CommentEntity, UUID> {

    Optional<CommentEntity> findByIdAndAuthorId(UUID id, UUID authorId);

    Page<CommentEntity> findAllByResourceIdAndParentCommentIdIsNull(
            UUID resourceId,
            Pageable pageable
    );

    List<CommentEntity> findAllByRootCommentIdAndParentCommentIdIsNotNullOrderByCreatedAtAscIdAsc(
            UUID rootCommentId
    );

    long countByResourceIdAndParentCommentIdIsNull(UUID resourceId);

    long countByRootCommentIdAndParentCommentIdIsNotNull(UUID rootCommentId);

    long countByResourceId(UUID resourceId);

    Page<CommentEntity> findAllByStatusOrderByCreatedAtDesc(
            CommentStatus status,
            Pageable pageable
    );

    long countByStatus(CommentStatus status);

    long countByAuthorIdAndStatus(UUID authorId, CommentStatus status);

    @Query("""
            select comment.resourceId as resourceId, count(comment) as total
              from CommentEntity comment
             where comment.resourceId in :resourceIds
               and comment.status = com.educhain.interaction.domain.CommentStatus.VISIBLE
             group by comment.resourceId
            """)
    java.util.List<ResourceCountProjection> countGroupedByResourceId(
            @Param("resourceIds") java.util.Collection<UUID> resourceIds
    );
}

package com.educhain.externalcontent.repository;

import com.educhain.externalcontent.entity.ExternalContentItemEntity;
import com.educhain.externalcontent.domain.ExternalQualityStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExternalContentItemRepository extends JpaRepository<ExternalContentItemEntity, UUID> {
    Optional<ExternalContentItemEntity> findByUrlDigest(String urlDigest);

    @EntityGraph(attributePaths = "source")
    Page<ExternalContentItemEntity> findAllByOrderByFetchedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "source")
    Page<ExternalContentItemEntity> findAllByQualityStatusOrderByFetchedAtDesc(
            ExternalQualityStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "source")
    @Query("""
            SELECT item FROM ExternalContentItemEntity item
            WHERE item.qualityStatus = com.educhain.externalcontent.domain.ExternalQualityStatus.APPROVED
              AND item.source.enabled = true
              AND (:query = '' OR LOWER(item.title) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(item.summary) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(item.authorName) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY COALESCE(item.publishedAt, item.fetchedAt) DESC, item.id DESC
            """)
    Page<ExternalContentItemEntity> searchPublic(@Param("query") String query, Pageable pageable);
}

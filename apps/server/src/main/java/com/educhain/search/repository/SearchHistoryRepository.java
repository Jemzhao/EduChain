package com.educhain.search.repository;

import com.educhain.search.entity.SearchHistoryEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchHistoryRepository extends JpaRepository<SearchHistoryEntity, UUID> {

    List<SearchHistoryEntity> findAllByUserIdOrderBySearchedAtDesc(UUID userId, Pageable pageable);

    long deleteByIdAndUserId(UUID id, UUID userId);

    long deleteAllByUserId(UUID userId);

    long deleteAllByUserIdAndSearchedAtBefore(UUID userId, Instant cutoff);

    @Query("""
            select history.queryValue as queryValue, count(history.id) as searchCount
              from SearchHistoryEntity history
             where history.searchedAt >= :since
               and length(history.queryValue) between 2 and 80
               and history.queryValue not like '%@%'
             group by history.queryValue
            having count(history.id) >= 2
             order by count(history.id) desc, max(history.searchedAt) desc
            """)
    List<SearchKeywordProjection> findPopular(@Param("since") Instant since, Pageable pageable);
}

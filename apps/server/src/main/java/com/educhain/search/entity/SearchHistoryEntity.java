package com.educhain.search.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_search_history")
public class SearchHistoryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "query_value", nullable = false, updatable = false, length = 200)
    private String queryValue;

    @Column(name = "result_count", nullable = false, updatable = false)
    private int resultCount;

    @Column(name = "searched_at", nullable = false, updatable = false)
    private Instant searchedAt;

    protected SearchHistoryEntity() {
    }

    public SearchHistoryEntity(UUID userId, String queryValue, int resultCount, Instant searchedAt) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.queryValue = queryValue;
        this.resultCount = resultCount;
        this.searchedAt = searchedAt;
    }

    public UUID getId() { return id; }
    public String getQueryValue() { return queryValue; }
    public int getResultCount() { return resultCount; }
    public Instant getSearchedAt() { return searchedAt; }
}

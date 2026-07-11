package com.educhain.search.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "search_event")
public class SearchEventEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "query_hash", nullable = false, updatable = false, length = 64)
    private String queryHash;

    @Column(name = "query_length", nullable = false, updatable = false)
    private int queryLength;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filter_summary", nullable = false, updatable = false, columnDefinition = "JSON")
    private String filterSummary;

    @Column(name = "result_count", nullable = false, updatable = false)
    private int resultCount;

    @Column(name = "actor_pseudonym", updatable = false, length = 64)
    private String actorPseudonym;

    @Column(name = "retention_until", nullable = false, updatable = false)
    private Instant retentionUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SearchEventEntity() {
    }

    public SearchEventEntity(
            UUID id,
            String queryHash,
            int queryLength,
            String filterSummary,
            int resultCount,
            Instant retentionUntil
    ) {
        this.id = id;
        this.queryHash = queryHash;
        this.queryLength = queryLength;
        this.filterSummary = filterSummary;
        this.resultCount = resultCount;
        this.retentionUntil = retentionUntil;
    }
}

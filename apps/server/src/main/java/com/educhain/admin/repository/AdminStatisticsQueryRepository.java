package com.educhain.admin.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminStatisticsQueryRepository {
    private final JdbcTemplate jdbc;

    public AdminStatisticsQueryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Long> registrations(Instant start) {
        return daily("user_account", "created_at", start);
    }

    public Map<String, Long> publications(Instant start) {
        return daily("knowledge_resource", "published_at", start);
    }

    public Map<String, Long> views(Instant start) {
        return daily("resource_view", "first_viewed_at", start);
    }

    private Map<String, Long> daily(String table, String column, Instant start) {
        String sql = "SELECT DATE_FORMAT(" + column + ", '%Y-%m-%d') AS period, COUNT(*) AS total "
                + "FROM " + table + " WHERE " + column + " >= ? "
                + "GROUP BY DATE_FORMAT(" + column + ", '%Y-%m-%d') ORDER BY period";
        Map<String, Long> result = new LinkedHashMap<>();
        jdbc.query(
                sql,
                (row, ignored) -> Map.entry(row.getString("period"), row.getLong("total")),
                Timestamp.from(start)
        ).forEach(entry -> result.put(entry.getKey(), entry.getValue()));
        return Map.copyOf(result);
    }
}

CREATE TABLE user_search_history (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    query_value VARCHAR(200) NOT NULL,
    result_count INT NOT NULL,
    searched_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_user_search_history_user FOREIGN KEY (user_id) REFERENCES user_account (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_search_history_result_count CHECK (result_count >= 0),
    INDEX idx_user_search_history_recent (user_id, searched_at DESC, id)
) ENGINE = InnoDB;

CREATE TABLE operational_alert (
    id BINARY(16) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    component_name VARCHAR(80) NOT NULL,
    summary_code VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    occurrence_count BIGINT NOT NULL DEFAULT 1,
    first_seen_at TIMESTAMP(6) NOT NULL,
    last_seen_at TIMESTAMP(6) NOT NULL,
    resolved_at TIMESTAMP(6) NULL,
    resolved_by BINARY(16) NULL,
    resolution_reason VARCHAR(500) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_operational_alert_resolver FOREIGN KEY (resolved_by) REFERENCES user_account (id),
    CONSTRAINT chk_operational_alert_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    CONSTRAINT chk_operational_alert_status CHECK (status IN ('OPEN', 'RESOLVED')),
    CONSTRAINT chk_operational_alert_occurrences CHECK (occurrence_count >= 1),
    INDEX idx_operational_alert_status (status, severity, last_seen_at DESC)
) ENGINE = InnoDB;

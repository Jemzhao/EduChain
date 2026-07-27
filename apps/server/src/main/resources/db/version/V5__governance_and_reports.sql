CREATE TABLE report (
    id BINARY(16) NOT NULL,
    reporter_id BINARY(16) NOT NULL,
    target_type VARCHAR(24) NOT NULL,
    target_id BINARY(16) NOT NULL,
    reason_code VARCHAR(32) NOT NULL,
    details VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL,
    resolution VARCHAR(500) NULL,
    resolved_by BINARY(16) NULL,
    resolved_at TIMESTAMP(6) NULL,
    open_deduplication_key CHAR(64) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_report_open_deduplication UNIQUE (open_deduplication_key),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES user_account (id),
    CONSTRAINT fk_report_resolver FOREIGN KEY (resolved_by) REFERENCES user_account (id),
    CONSTRAINT chk_report_target CHECK (target_type IN ('RESOURCE', 'COMMENT')),
    CONSTRAINT chk_report_reason CHECK (reason_code IN ('SPAM', 'HARASSMENT', 'COPYRIGHT', 'MISINFORMATION', 'UNSAFE_CONTENT', 'OTHER')),
    CONSTRAINT chk_report_status CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    INDEX idx_report_queue (status, created_at, id),
    INDEX idx_report_target (target_type, target_id, created_at)
) ENGINE = InnoDB;

ALTER TABLE comment ADD COLUMN moderation_body VARCHAR(2000) NULL AFTER body_content;

CREATE INDEX idx_user_account_governance ON user_account (status, created_at, id);
CREATE INDEX idx_comment_governance ON comment (status, created_at, id);
CREATE INDEX idx_evidence_job_governance ON evidence_job (status, updated_at, id);

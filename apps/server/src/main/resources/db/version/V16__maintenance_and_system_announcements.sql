ALTER TABLE notification
    DROP CHECK chk_notification_type,
    ADD CONSTRAINT chk_notification_type CHECK (
        notification_type IN (
            'COMMENT_REPLY',
            'RESOURCE_LIKED',
            'RESOURCE_COMMENT',
            'FOLLOWED_AUTHOR_PUBLISHED',
            'NEW_FOLLOWER',
            'RESOURCE_STATUS',
            'EVIDENCE_RESULT',
            'SYSTEM_ANNOUNCEMENT'
        )
    ),
    ADD COLUMN system_title VARCHAR(120) NULL AFTER comment_id,
    ADD COLUMN system_body VARCHAR(1000) NULL AFTER system_title;

ALTER TABLE notification_preference
    DROP CHECK chk_notification_preference_type,
    ADD CONSTRAINT chk_notification_preference_type CHECK (
        notification_type IN (
            'COMMENT_REPLY',
            'RESOURCE_LIKED',
            'RESOURCE_COMMENT',
            'FOLLOWED_AUTHOR_PUBLISHED',
            'NEW_FOLLOWER',
            'RESOURCE_STATUS',
            'EVIDENCE_RESULT',
            'SYSTEM_ANNOUNCEMENT'
        )
    );

CREATE TABLE search_document (
    resource_id BINARY(16) NOT NULL,
    version_id BINARY(16) NOT NULL,
    title VARCHAR(240) NOT NULL,
    summary TEXT NOT NULL,
    body_content MEDIUMTEXT NOT NULL,
    rebuilt_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (resource_id),
    CONSTRAINT uk_search_document_version UNIQUE (version_id),
    CONSTRAINT fk_search_document_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id) ON DELETE CASCADE,
    CONSTRAINT fk_search_document_version FOREIGN KEY (version_id) REFERENCES knowledge_version (id) ON DELETE CASCADE,
    FULLTEXT INDEX ft_search_document (title, summary, body_content)
) ENGINE = InnoDB;

CREATE TABLE admin_maintenance_job (
    id BINARY(16) NOT NULL,
    job_type VARCHAR(40) NOT NULL,
    status VARCHAR(24) NOT NULL,
    requested_by BINARY(16) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    payload_summary VARCHAR(200) NOT NULL,
    result_summary VARCHAR(200) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_requester FOREIGN KEY (requested_by) REFERENCES user_account (id),
    CONSTRAINT chk_maintenance_job_type CHECK (
        job_type IN ('SEARCH_REBUILD', 'EXPIRED_DATA_CLEANUP', 'BACKUP_REQUEST', 'SYSTEM_ANNOUNCEMENT')
    ),
    CONSTRAINT chk_maintenance_status CHECK (status IN ('ACCEPTED', 'COMPLETED', 'FAILED')),
    INDEX idx_maintenance_jobs (created_at, id)
) ENGINE = InnoDB;

CREATE TABLE resource_view (
    id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    user_id BINARY(16) NULL,
    viewer_key CHAR(64) NOT NULL,
    first_viewed_at TIMESTAMP(6) NOT NULL,
    last_viewed_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_resource_viewer UNIQUE (resource_id, viewer_key),
    CONSTRAINT fk_resource_view_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_resource_view_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    INDEX idx_resource_view_count (resource_id),
    INDEX idx_resource_view_history (user_id, last_viewed_at)
) ENGINE = InnoDB;

CREATE TABLE user_activity_event (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    activity_type VARCHAR(40) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_activity_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT chk_activity_type CHECK (
        activity_type IN (
            'VIEWED_RESOURCE',
            'LIKED_RESOURCE',
            'SAVED_RESOURCE',
            'COMMENTED_RESOURCE',
            'PUBLISHED_RESOURCE'
        )
    ),
    INDEX idx_activity_user (user_id, created_at),
    INDEX idx_activity_resource (resource_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE resource_like (
    user_id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, resource_id),
    CONSTRAINT fk_resource_like_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_resource_like_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    INDEX idx_resource_like_resource (resource_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE resource_collection (
    id BINARY(16) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    display_name VARCHAR(60) NOT NULL,
    name_normalized VARCHAR(60) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    default_owner_id BINARY(16) GENERATED ALWAYS AS (
        CASE WHEN is_default = TRUE THEN owner_id ELSE NULL END
    ) STORED,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_resource_collection_name UNIQUE (owner_id, name_normalized),
    CONSTRAINT uk_resource_collection_default UNIQUE (default_owner_id),
    CONSTRAINT fk_resource_collection_owner FOREIGN KEY (owner_id) REFERENCES user_account (id),
    INDEX idx_resource_collection_owner (owner_id, is_default, created_at)
) ENGINE = InnoDB;

CREATE TABLE collection_item (
    collection_id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (collection_id, resource_id),
    CONSTRAINT fk_collection_item_collection FOREIGN KEY (collection_id) REFERENCES resource_collection (id) ON DELETE CASCADE,
    CONSTRAINT fk_collection_item_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    INDEX idx_collection_item_resource (resource_id, created_at),
    INDEX idx_collection_item_order (collection_id, created_at, resource_id)
) ENGINE = InnoDB;

CREATE TABLE comment (
    id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    author_id BINARY(16) NOT NULL,
    parent_comment_id BINARY(16) NULL,
    root_comment_id BINARY(16) NOT NULL,
    body_content VARCHAR(2000) NULL,
    status VARCHAR(24) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_comment_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES user_account (id),
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES comment (id),
    CONSTRAINT fk_comment_root FOREIGN KEY (root_comment_id) REFERENCES comment (id),
    CONSTRAINT chk_comment_status CHECK (status IN ('VISIBLE', 'DELETED', 'HIDDEN')),
    CONSTRAINT chk_comment_body CHECK (
        (status = 'VISIBLE' AND body_content IS NOT NULL AND CHAR_LENGTH(body_content) > 0)
        OR (status IN ('DELETED', 'HIDDEN') AND body_content IS NULL)
    ),
    INDEX idx_comment_resource_roots (resource_id, parent_comment_id, created_at, id),
    INDEX idx_comment_root_replies (root_comment_id, parent_comment_id, created_at, id),
    INDEX idx_comment_author (author_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE follow_relation (
    follower_id BINARY(16) NOT NULL,
    followed_id BINARY(16) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT fk_follow_relation_follower FOREIGN KEY (follower_id) REFERENCES user_account (id),
    CONSTRAINT fk_follow_relation_followed FOREIGN KEY (followed_id) REFERENCES user_account (id),
    CONSTRAINT chk_follow_relation_distinct CHECK (follower_id <> followed_id),
    INDEX idx_follow_relation_followed (followed_id, created_at),
    INDEX idx_follow_relation_follower (follower_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE notification (
    id BINARY(16) NOT NULL,
    recipient_id BINARY(16) NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    deduplication_key VARCHAR(160) NOT NULL,
    actor_id BINARY(16) NULL,
    resource_id BINARY(16) NULL,
    comment_id BINARY(16) NULL,
    read_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_notification_deduplication UNIQUE (recipient_id, deduplication_key),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES user_account (id),
    CONSTRAINT fk_notification_actor FOREIGN KEY (actor_id) REFERENCES user_account (id),
    CONSTRAINT fk_notification_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_notification_comment FOREIGN KEY (comment_id) REFERENCES comment (id),
    CONSTRAINT chk_notification_type CHECK (notification_type IN ('COMMENT_REPLY', 'NEW_FOLLOWER', 'RESOURCE_STATUS', 'EVIDENCE_RESULT')),
    INDEX idx_notification_inbox (recipient_id, created_at, id),
    INDEX idx_notification_unread (recipient_id, read_at, created_at)
) ENGINE = InnoDB;

CREATE TABLE notification_preference (
    user_id BINARY(16) NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    external_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, notification_type),
    CONSTRAINT fk_notification_preference_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT chk_notification_preference_type CHECK (notification_type IN ('COMMENT_REPLY', 'NEW_FOLLOWER', 'RESOURCE_STATUS', 'EVIDENCE_RESULT'))
) ENGINE = InnoDB;

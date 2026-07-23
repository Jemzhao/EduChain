CREATE TABLE external_content_source (
    id BINARY(16) NOT NULL,
    name VARCHAR(120) NOT NULL,
    site_url VARCHAR(2048) NOT NULL,
    feed_url VARCHAR(2048) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_status VARCHAR(24) NOT NULL DEFAULT 'NEVER_SYNCED',
    last_sync_error VARCHAR(80) NULL,
    last_synced_at TIMESTAMP(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_external_source_name UNIQUE (name),
    CONSTRAINT uk_external_source_feed UNIQUE (feed_url(512)),
    CONSTRAINT chk_external_source_sync_status CHECK (
        sync_status IN ('NEVER_SYNCED', 'RUNNING', 'SUCCEEDED', 'FAILED')
    ),
    INDEX idx_external_source_enabled (enabled, name)
) ENGINE = InnoDB;

CREATE TABLE external_content_item (
    id BINARY(16) NOT NULL,
    source_id BINARY(16) NOT NULL,
    external_key VARCHAR(200) NOT NULL,
    canonical_url VARCHAR(2048) NOT NULL,
    url_digest CHAR(64) NOT NULL,
    title VARCHAR(240) NOT NULL,
    summary TEXT NOT NULL,
    author_name VARCHAR(160) NOT NULL,
    quality_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    published_at TIMESTAMP(6) NULL,
    fetched_at TIMESTAMP(6) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_external_item_source FOREIGN KEY (source_id) REFERENCES external_content_source (id),
    CONSTRAINT uk_external_item_url_digest UNIQUE (url_digest),
    CONSTRAINT uk_external_item_source_key UNIQUE (source_id, external_key),
    CONSTRAINT chk_external_item_quality CHECK (quality_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    INDEX idx_external_item_public (quality_status, published_at, id),
    INDEX idx_external_item_source (source_id, fetched_at, id),
    FULLTEXT INDEX ft_external_item_search (title, summary, author_name)
) ENGINE = InnoDB;

UPDATE platform_setting
SET setting_value = 'true'
WHERE setting_key = 'features.external_content_enabled';

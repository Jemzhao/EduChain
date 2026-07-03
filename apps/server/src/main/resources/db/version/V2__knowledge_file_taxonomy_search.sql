CREATE TABLE category (
    id BINARY(16) NOT NULL,
    parent_id BINARY(16) NULL,
    slug VARCHAR(80) NOT NULL,
    name_key VARCHAR(120) NOT NULL,
    description_key VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(24) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_category_slug UNIQUE (slug),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES category (id),
    CONSTRAINT chk_category_status CHECK (status IN ('ACTIVE', 'DISABLED')),
    CONSTRAINT chk_category_order CHECK (sort_order >= 0),
    INDEX idx_category_navigation (parent_id, status, sort_order)
) ENGINE = InnoDB;

CREATE TABLE tag (
    id BINARY(16) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    canonical_name VARCHAR(80) NOT NULL,
    description VARCHAR(240) NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_tag_slug UNIQUE (slug),
    CONSTRAINT chk_tag_status CHECK (status IN ('ACTIVE', 'DISABLED')),
    INDEX idx_tag_discovery (status, canonical_name)
) ENGINE = InnoDB;

CREATE TABLE tag_alias (
    id BINARY(16) NOT NULL,
    tag_id BINARY(16) NOT NULL,
    alias_normalized VARCHAR(80) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_tag_alias UNIQUE (alias_normalized),
    CONSTRAINT fk_tag_alias_tag FOREIGN KEY (tag_id) REFERENCES tag (id)
) ENGINE = InnoDB;

CREATE TABLE file_object (
    id BINARY(16) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    storage_provider VARCHAR(32) NOT NULL,
    storage_key VARCHAR(320) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    declared_size BIGINT NOT NULL,
    received_size BIGINT NULL,
    declared_media_type VARCHAR(120) NOT NULL,
    detected_media_type VARCHAR(120) NULL,
    sha256 CHAR(64) NULL,
    status VARCHAR(24) NOT NULL,
    rejection_code VARCHAR(80) NULL,
    retention_until TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_file_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_file_owner FOREIGN KEY (owner_id) REFERENCES user_account (id),
    CONSTRAINT chk_file_purpose CHECK (purpose IN ('RESOURCE_ATTACHMENT', 'RESOURCE_COVER', 'AVATAR', 'VERIFICATION')),
    CONSTRAINT chk_file_status CHECK (status IN ('CREATED', 'UPLOADING', 'SCANNING', 'AVAILABLE', 'REJECTED', 'EXPIRED')),
    CONSTRAINT chk_file_declared_size CHECK (declared_size > 0 AND declared_size <= 26214400),
    CONSTRAINT chk_file_received_size CHECK (received_size IS NULL OR received_size >= 0),
    INDEX idx_file_owner_status (owner_id, status, created_at),
    INDEX idx_file_retention (status, retention_until)
) ENGINE = InnoDB;

CREATE TABLE upload_session (
    id BINARY(16) NOT NULL,
    file_id BINARY(16) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    status VARCHAR(24) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    completed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_upload_file UNIQUE (file_id),
    CONSTRAINT fk_upload_file FOREIGN KEY (file_id) REFERENCES file_object (id),
    CONSTRAINT fk_upload_owner FOREIGN KEY (owner_id) REFERENCES user_account (id),
    CONSTRAINT chk_upload_status CHECK (status IN ('CREATED', 'UPLOADING', 'RECEIVED', 'COMPLETED', 'REJECTED', 'EXPIRED')),
    INDEX idx_upload_owner_active (owner_id, status, expires_at),
    INDEX idx_upload_expiry (status, expires_at)
) ENGINE = InnoDB;

CREATE TABLE knowledge_resource (
    id BINARY(16) NOT NULL,
    public_slug VARCHAR(120) NOT NULL,
    author_id BINARY(16) NOT NULL,
    status VARCHAR(24) NOT NULL,
    current_public_version_id BINARY(16) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    published_at TIMESTAMP(6) NULL,
    withdrawn_at TIMESTAMP(6) NULL,
    deleted_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_knowledge_resource_slug UNIQUE (public_slug),
    CONSTRAINT fk_knowledge_resource_author FOREIGN KEY (author_id) REFERENCES user_account (id),
    CONSTRAINT chk_knowledge_resource_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'WITHDRAWN')),
    INDEX idx_knowledge_resource_author (author_id, status, updated_at),
    INDEX idx_knowledge_resource_public (status, published_at, id)
) ENGINE = InnoDB;

CREATE TABLE knowledge_draft (
    resource_id BINARY(16) NOT NULL,
    title VARCHAR(160) NOT NULL DEFAULT '',
    summary VARCHAR(600) NOT NULL DEFAULT '',
    body_content MEDIUMTEXT NOT NULL,
    category_id BINARY(16) NULL,
    cover_file_id BINARY(16) NULL,
    copyright_statement VARCHAR(500) NOT NULL DEFAULT '',
    version BIGINT NOT NULL DEFAULT 0,
    saved_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (resource_id),
    CONSTRAINT fk_knowledge_draft_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_knowledge_draft_category FOREIGN KEY (category_id) REFERENCES category (id),
    CONSTRAINT fk_knowledge_draft_cover FOREIGN KEY (cover_file_id) REFERENCES file_object (id)
) ENGINE = InnoDB;

CREATE TABLE knowledge_draft_tag (
    resource_id BINARY(16) NOT NULL,
    tag_id BINARY(16) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (resource_id, tag_id),
    CONSTRAINT uk_knowledge_draft_tag_order UNIQUE (resource_id, sort_order),
    CONSTRAINT fk_knowledge_draft_tag_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_knowledge_draft_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id),
    CONSTRAINT chk_knowledge_draft_tag_order CHECK (sort_order >= 0)
) ENGINE = InnoDB;

CREATE TABLE knowledge_draft_file (
    resource_id BINARY(16) NOT NULL,
    file_id BINARY(16) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    purpose VARCHAR(24) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (resource_id, file_id),
    CONSTRAINT uk_knowledge_draft_file_order UNIQUE (resource_id, sort_order),
    CONSTRAINT fk_knowledge_draft_file_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_knowledge_draft_file_file FOREIGN KEY (file_id) REFERENCES file_object (id),
    CONSTRAINT chk_knowledge_draft_file_purpose CHECK (purpose IN ('ATTACHMENT', 'SUPPLEMENT')),
    CONSTRAINT chk_knowledge_draft_file_order CHECK (sort_order >= 0)
) ENGINE = InnoDB;

CREATE TABLE knowledge_version (
    id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    version_number INT NOT NULL,
    title VARCHAR(160) NOT NULL,
    summary VARCHAR(600) NOT NULL,
    body_content MEDIUMTEXT NOT NULL,
    category_id BINARY(16) NOT NULL,
    cover_file_id BINARY(16) NULL,
    copyright_statement VARCHAR(500) NOT NULL,
    publisher_id BINARY(16) NOT NULL,
    content_schema_version VARCHAR(24) NOT NULL,
    content_digest CHAR(64) NOT NULL,
    reading_minutes INT NOT NULL,
    published_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_knowledge_version_number UNIQUE (resource_id, version_number),
    CONSTRAINT uk_knowledge_version_digest UNIQUE (resource_id, content_digest),
    CONSTRAINT fk_knowledge_version_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_knowledge_version_category FOREIGN KEY (category_id) REFERENCES category (id),
    CONSTRAINT fk_knowledge_version_cover FOREIGN KEY (cover_file_id) REFERENCES file_object (id),
    CONSTRAINT fk_knowledge_version_publisher FOREIGN KEY (publisher_id) REFERENCES user_account (id),
    CONSTRAINT chk_knowledge_version_number CHECK (version_number > 0),
    CONSTRAINT chk_knowledge_version_reading CHECK (reading_minutes > 0),
    INDEX idx_knowledge_version_category (category_id, published_at, id),
    FULLTEXT INDEX ftx_knowledge_version_content (title, summary, body_content)
) ENGINE = InnoDB;

ALTER TABLE knowledge_resource
    ADD CONSTRAINT fk_knowledge_resource_current_version
    FOREIGN KEY (current_public_version_id) REFERENCES knowledge_version (id);

CREATE TABLE knowledge_version_tag (
    version_id BINARY(16) NOT NULL,
    tag_id BINARY(16) NOT NULL,
    sort_order INT NOT NULL,
    PRIMARY KEY (version_id, tag_id),
    CONSTRAINT uk_knowledge_version_tag_order UNIQUE (version_id, sort_order),
    CONSTRAINT fk_knowledge_version_tag_version FOREIGN KEY (version_id) REFERENCES knowledge_version (id),
    CONSTRAINT fk_knowledge_version_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id),
    CONSTRAINT chk_knowledge_version_tag_order CHECK (sort_order >= 0),
    INDEX idx_knowledge_version_tag_lookup (tag_id, version_id)
) ENGINE = InnoDB;

CREATE TABLE knowledge_version_file (
    version_id BINARY(16) NOT NULL,
    file_id BINARY(16) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    purpose VARCHAR(24) NOT NULL,
    sort_order INT NOT NULL,
    sha256_at_publication CHAR(64) NOT NULL,
    PRIMARY KEY (version_id, file_id),
    CONSTRAINT uk_knowledge_version_file_order UNIQUE (version_id, sort_order),
    CONSTRAINT fk_knowledge_version_file_version FOREIGN KEY (version_id) REFERENCES knowledge_version (id),
    CONSTRAINT fk_knowledge_version_file_file FOREIGN KEY (file_id) REFERENCES file_object (id),
    CONSTRAINT chk_knowledge_version_file_purpose CHECK (purpose IN ('ATTACHMENT', 'SUPPLEMENT')),
    CONSTRAINT chk_knowledge_version_file_order CHECK (sort_order >= 0)
) ENGINE = InnoDB;

CREATE TABLE search_event (
    id BINARY(16) NOT NULL,
    query_hash CHAR(64) NOT NULL,
    query_length INT NOT NULL,
    filter_summary JSON NOT NULL,
    result_count INT NOT NULL,
    actor_pseudonym CHAR(64) NULL,
    retention_until TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT chk_search_event_query_length CHECK (query_length >= 0),
    CONSTRAINT chk_search_event_result_count CHECK (result_count >= 0),
    INDEX idx_search_event_retention (retention_until),
    INDEX idx_search_event_query (query_hash, created_at)
) ENGINE = InnoDB;

INSERT INTO category (id, parent_id, slug, name_key, description_key, sort_order, status)
VALUES
    (UNHEX(REPLACE('10000000-0000-4000-8000-000000000001', '-', '')), NULL, 'computer-science', 'category.computerScience.name', 'category.computerScience.description', 10, 'ACTIVE'),
    (UNHEX(REPLACE('10000000-0000-4000-8000-000000000002', '-', '')), NULL, 'mathematics', 'category.mathematics.name', 'category.mathematics.description', 20, 'ACTIVE'),
    (UNHEX(REPLACE('10000000-0000-4000-8000-000000000003', '-', '')), NULL, 'education', 'category.education.name', 'category.education.description', 30, 'ACTIVE'),
    (UNHEX(REPLACE('10000000-0000-4000-8000-000000000004', '-', '')), NULL, 'engineering', 'category.engineering.name', 'category.engineering.description', 40, 'ACTIVE'),
    (UNHEX(REPLACE('10000000-0000-4000-8000-000000000005', '-', '')), NULL, 'humanities', 'category.humanities.name', 'category.humanities.description', 50, 'ACTIVE');

INSERT INTO tag (id, slug, canonical_name, description, status)
VALUES
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000001', '-', '')), 'blockchain', 'Blockchain', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000002', '-', '')), 'java', 'Java', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000003', '-', '')), 'web-development', 'Web Development', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000004', '-', '')), 'algorithms', 'Algorithms', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000005', '-', '')), 'databases', 'Databases', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000006', '-', '')), 'research-methods', 'Research Methods', '', 'ACTIVE'),
    (UNHEX(REPLACE('20000000-0000-4000-8000-000000000007', '-', '')), 'learning-design', 'Learning Design', '', 'ACTIVE');

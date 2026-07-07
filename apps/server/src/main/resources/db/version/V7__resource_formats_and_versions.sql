ALTER TABLE knowledge_draft
    ADD COLUMN resource_type VARCHAR(24) NOT NULL DEFAULT 'ARTICLE' AFTER body_content,
    ADD COLUMN source_url VARCHAR(2048) NOT NULL DEFAULT '' AFTER resource_type,
    ADD CONSTRAINT chk_knowledge_draft_type
        CHECK (resource_type IN ('ARTICLE', 'DOCUMENT', 'VIDEO', 'LINK'));

ALTER TABLE knowledge_version
    ADD COLUMN resource_type VARCHAR(24) NOT NULL DEFAULT 'ARTICLE' AFTER body_content,
    ADD COLUMN source_url VARCHAR(2048) NOT NULL DEFAULT '' AFTER resource_type,
    ADD CONSTRAINT chk_knowledge_version_type
        CHECK (resource_type IN ('ARTICLE', 'DOCUMENT', 'VIDEO', 'LINK'));

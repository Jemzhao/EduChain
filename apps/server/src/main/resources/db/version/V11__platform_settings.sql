CREATE TABLE platform_setting (
    setting_key VARCHAR(100) NOT NULL,
    value_type VARCHAR(24) NOT NULL,
    setting_value VARCHAR(500) NOT NULL,
    public_visible BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    updated_by BINARY(16) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (setting_key),
    CONSTRAINT fk_platform_setting_updater FOREIGN KEY (updated_by) REFERENCES user_account (id),
    CONSTRAINT chk_platform_setting_type CHECK (value_type IN ('TEXT', 'BOOLEAN', 'INTEGER')),
    INDEX idx_platform_setting_public (public_visible, setting_key)
) ENGINE = InnoDB;

INSERT INTO platform_setting (
    setting_key,
    value_type,
    setting_value,
    public_visible
) VALUES
    ('site.display_name', 'TEXT', 'EduChain', TRUE),
    ('content.default_license', 'TEXT', 'CC BY-NC 4.0', TRUE),
    ('features.registrations_enabled', 'BOOLEAN', 'true', TRUE),
    ('features.external_content_enabled', 'BOOLEAN', 'false', TRUE),
    ('content.comments_enabled', 'BOOLEAN', 'true', TRUE),
    ('operations.maintenance_notice', 'TEXT', '', TRUE);

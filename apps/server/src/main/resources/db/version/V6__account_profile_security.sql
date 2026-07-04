ALTER TABLE user_profile
    ADD COLUMN location VARCHAR(120) NOT NULL DEFAULT '' AFTER avatar_file_id,
    ADD COLUMN website_url VARCHAR(300) NOT NULL DEFAULT '' AFTER location,
    ADD COLUMN contact_email VARCHAR(254) NOT NULL DEFAULT '' AFTER website_url,
    ADD CONSTRAINT fk_user_profile_avatar
        FOREIGN KEY (avatar_file_id) REFERENCES file_object (id);

CREATE TABLE password_reset_token (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    consumed_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_token_user
        FOREIGN KEY (user_id) REFERENCES user_account (id),
    INDEX idx_password_reset_user_active (user_id, consumed_at, expires_at),
    INDEX idx_password_reset_expiry (expires_at)
) ENGINE = InnoDB;

CREATE TABLE user_account (
    id BINARY(16) NOT NULL,
    email_normalized VARCHAR(254) NOT NULL,
    handle_normalized VARCHAR(32) NOT NULL,
    status VARCHAR(24) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_user_account_email UNIQUE (email_normalized),
    CONSTRAINT uk_user_account_handle UNIQUE (handle_normalized),
    CONSTRAINT chk_user_account_status CHECK (status IN ('ACTIVE', 'RESTRICTED', 'DISABLED'))
) ENGINE = InnoDB;

CREATE TABLE user_profile (
    user_id BINARY(16) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    bio VARCHAR(500) NOT NULL DEFAULT '',
    education VARCHAR(160) NOT NULL DEFAULT '',
    avatar_file_id BINARY(16) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_profile_account FOREIGN KEY (user_id) REFERENCES user_account (id)
) ENGINE = InnoDB;

CREATE TABLE user_role (
    user_id BINARY(16) NOT NULL,
    role_name VARCHAR(32) NOT NULL,
    granted_by BINARY(16) NULL,
    granted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_user_role_account FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_user_role_granter FOREIGN KEY (granted_by) REFERENCES user_account (id),
    CONSTRAINT chk_user_role_name CHECK (role_name IN ('USER', 'MODERATOR', 'ADMINISTRATOR'))
) ENGINE = InnoDB;

CREATE TABLE auth_credential (
    user_id BINARY(16) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_algorithm VARCHAR(32) NOT NULL,
    password_changed_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP(6) NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_auth_credential_account FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT chk_auth_credential_attempts CHECK (failed_attempts >= 0)
) ENGINE = InnoDB;

CREATE TABLE refresh_session (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    session_family_id BINARY(16) NOT NULL,
    device_label VARCHAR(120) NOT NULL DEFAULT '',
    user_agent_hash CHAR(64) NULL,
    ip_prefix_hash CHAR(64) NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6) NULL,
    rotated_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_session_token UNIQUE (token_hash),
    CONSTRAINT fk_refresh_session_account FOREIGN KEY (user_id) REFERENCES user_account (id),
    INDEX idx_refresh_session_user_active (user_id, revoked_at, expires_at),
    INDEX idx_refresh_session_family (session_family_id)
) ENGINE = InnoDB;

CREATE TABLE idempotency_record (
    id BINARY(16) NOT NULL,
    actor_id BINARY(16) NULL,
    scope_name VARCHAR(80) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_digest CHAR(64) NOT NULL,
    result_reference VARCHAR(160) NULL,
    response_status SMALLINT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_idempotency_scope_key UNIQUE (scope_name, idempotency_key),
    CONSTRAINT fk_idempotency_actor FOREIGN KEY (actor_id) REFERENCES user_account (id),
    INDEX idx_idempotency_expiry (expires_at)
) ENGINE = InnoDB;

CREATE TABLE reliable_job (
    id BINARY(16) NOT NULL,
    job_type VARCHAR(80) NOT NULL,
    business_key VARCHAR(160) NOT NULL,
    payload_version SMALLINT NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(24) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    available_at TIMESTAMP(6) NOT NULL,
    lease_until TIMESTAMP(6) NULL,
    last_error_code VARCHAR(80) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_reliable_job_business UNIQUE (job_type, business_key),
    CONSTRAINT chk_reliable_job_status CHECK (status IN ('PENDING', 'RUNNING', 'RETRY_WAIT', 'COMPLETED', 'TERMINATED')),
    CONSTRAINT chk_reliable_job_attempts CHECK (attempt_count >= 0),
    INDEX idx_reliable_job_claim (status, available_at, lease_until)
) ENGINE = InnoDB;

CREATE TABLE audit_event (
    id BINARY(16) NOT NULL,
    actor_id BINARY(16) NULL,
    action_name VARCHAR(100) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id VARCHAR(160) NOT NULL,
    reason VARCHAR(500) NULL,
    request_id VARCHAR(128) NOT NULL,
    result_status VARCHAR(24) NOT NULL,
    context JSON NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_event_actor FOREIGN KEY (actor_id) REFERENCES user_account (id),
    CONSTRAINT chk_audit_event_result CHECK (result_status IN ('SUCCEEDED', 'REJECTED', 'FAILED')),
    INDEX idx_audit_event_target (target_type, target_id, created_at),
    INDEX idx_audit_event_actor (actor_id, created_at)
) ENGINE = InnoDB;

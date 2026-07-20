CREATE TABLE evidence_job (
    id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    version_id BINARY(16) NOT NULL,
    backend VARCHAR(24) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    payload_version SMALLINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP(6) NULL,
    lease_until TIMESTAMP(6) NULL,
    last_error_code VARCHAR(80) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_evidence_job_version UNIQUE (version_id, backend, payload_version),
    CONSTRAINT uk_evidence_job_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_evidence_job_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_evidence_job_version FOREIGN KEY (version_id) REFERENCES knowledge_version (id),
    CONSTRAINT chk_evidence_job_backend CHECK (backend IN ('SIMULATOR', 'CHAINMAKER')),
    CONSTRAINT chk_evidence_job_status CHECK (status IN (
        'PENDING', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CONFIRMING', 'RETRY_WAIT',
        'CONFIRMED', 'CERTIFICATE_PENDING', 'COMPLETED', 'CERTIFICATE_FAILED', 'TERMINATED'
    )),
    CONSTRAINT chk_evidence_job_attempts CHECK (attempt_count >= 0),
    INDEX idx_evidence_job_processing (status, next_attempt_at, lease_until),
    INDEX idx_evidence_job_resource (resource_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE evidence_record (
    id BINARY(16) NOT NULL,
    job_id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    version_id BINARY(16) NOT NULL,
    author_proof_id VARCHAR(128) NOT NULL,
    content_digest CHAR(64) NOT NULL,
    attachment_merkle_root CHAR(64) NULL,
    canonicalization_version VARCHAR(32) NOT NULL,
    payload_version SMALLINT NOT NULL,
    backend VARCHAR(24) NOT NULL,
    network_id VARCHAR(120) NOT NULL,
    transaction_id VARCHAR(160) NULL,
    block_height BIGINT NULL,
    block_hash VARCHAR(160) NULL,
    submitted_at TIMESTAMP(6) NOT NULL,
    confirmed_at TIMESTAMP(6) NOT NULL,
    raw_response JSON NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_evidence_record_job UNIQUE (job_id),
    CONSTRAINT uk_evidence_record_version UNIQUE (version_id, backend, payload_version),
    CONSTRAINT uk_evidence_record_transaction UNIQUE (backend, network_id, transaction_id),
    CONSTRAINT fk_evidence_record_job FOREIGN KEY (job_id) REFERENCES evidence_job (id),
    CONSTRAINT fk_evidence_record_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT fk_evidence_record_version FOREIGN KEY (version_id) REFERENCES knowledge_version (id),
    CONSTRAINT chk_evidence_record_backend CHECK (backend IN ('SIMULATOR', 'CHAINMAKER')),
    INDEX idx_evidence_record_resource (resource_id, confirmed_at),
    INDEX idx_evidence_record_digest (content_digest, confirmed_at)
) ENGINE = InnoDB;

CREATE TABLE certificate_artifact (
    id BINARY(16) NOT NULL,
    evidence_record_id BINARY(16) NOT NULL,
    template_version VARCHAR(40) NOT NULL,
    object_key VARCHAR(320) NULL,
    media_type VARCHAR(80) NOT NULL,
    size_bytes BIGINT NULL,
    sha256 CHAR(64) NULL,
    status VARCHAR(24) NOT NULL,
    last_error_code VARCHAR(80) NULL,
    generated_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_certificate_record_template UNIQUE (evidence_record_id, template_version),
    CONSTRAINT uk_certificate_object_key UNIQUE (object_key),
    CONSTRAINT fk_certificate_record FOREIGN KEY (evidence_record_id) REFERENCES evidence_record (id),
    CONSTRAINT chk_certificate_status CHECK (status IN ('PENDING', 'AVAILABLE', 'FAILED')),
    INDEX idx_certificate_status (status, updated_at)
) ENGINE = InnoDB;

CREATE TABLE verification_event (
    id BINARY(16) NOT NULL,
    evidence_record_id BINARY(16) NULL,
    method VARCHAR(24) NOT NULL,
    result VARCHAR(24) NOT NULL,
    checked_digest CHAR(64) NOT NULL,
    caller_pseudonym CHAR(64) NULL,
    retention_until TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_verification_record FOREIGN KEY (evidence_record_id) REFERENCES evidence_record (id),
    CONSTRAINT chk_verification_method CHECK (method IN ('DIGEST', 'FILE')),
    CONSTRAINT chk_verification_result CHECK (result IN (
        'MATCHED', 'MISMATCHED', 'NOT_FOUND', 'PENDING', 'UNAVAILABLE', 'INVALID_INPUT'
    )),
    INDEX idx_verification_record (evidence_record_id, created_at),
    INDEX idx_verification_retention (retention_until)
) ENGINE = InnoDB;

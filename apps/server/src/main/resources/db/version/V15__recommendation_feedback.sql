CREATE TABLE recommendation_feedback (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    resource_id BINARY(16) NOT NULL,
    feedback_type VARCHAR(24) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_recommendation_feedback_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_recommendation_feedback_resource FOREIGN KEY (resource_id) REFERENCES knowledge_resource (id),
    CONSTRAINT uk_recommendation_feedback UNIQUE (user_id, resource_id),
    CONSTRAINT chk_recommendation_feedback_type CHECK (feedback_type IN ('DISMISSED')),
    INDEX idx_recommendation_feedback_user (user_id, updated_at, resource_id)
) ENGINE = InnoDB;

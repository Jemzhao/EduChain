CREATE TABLE support_ticket (
    id BINARY(16) NOT NULL,
    requester_id BINARY(16) NOT NULL,
    category VARCHAR(32) NOT NULL,
    subject VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_support_ticket_requester FOREIGN KEY (requester_id) REFERENCES user_account (id),
    CONSTRAINT chk_support_ticket_category CHECK (category IN ('ACCOUNT', 'CONTENT', 'COPYRIGHT', 'EVIDENCE', 'TECHNICAL', 'OTHER')),
    CONSTRAINT chk_support_ticket_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_support_ticket_priority CHECK (priority IN ('NORMAL', 'HIGH')),
    INDEX idx_support_ticket_owner (requester_id, updated_at, id),
    INDEX idx_support_ticket_queue (status, priority, updated_at, id)
) ENGINE = InnoDB;

CREATE TABLE support_ticket_message (
    id BINARY(16) NOT NULL,
    ticket_id BINARY(16) NOT NULL,
    author_id BINARY(16) NOT NULL,
    staff_reply BOOLEAN NOT NULL DEFAULT FALSE,
    body_content TEXT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_support_message_ticket FOREIGN KEY (ticket_id) REFERENCES support_ticket (id) ON DELETE CASCADE,
    CONSTRAINT fk_support_message_author FOREIGN KEY (author_id) REFERENCES user_account (id),
    INDEX idx_support_message_thread (ticket_id, created_at, id)
) ENGINE = InnoDB;

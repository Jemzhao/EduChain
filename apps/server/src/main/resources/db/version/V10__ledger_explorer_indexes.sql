CREATE INDEX idx_evidence_record_blocks
    ON evidence_record (confirmed_at, backend, network_id, block_height);

CREATE INDEX idx_evidence_record_block_detail
    ON evidence_record (backend, network_id, block_height, confirmed_at);

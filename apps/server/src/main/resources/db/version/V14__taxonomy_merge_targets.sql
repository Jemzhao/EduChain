ALTER TABLE category
    ADD COLUMN merged_into_id BINARY(16) NULL AFTER status,
    ADD CONSTRAINT fk_category_merge_target FOREIGN KEY (merged_into_id) REFERENCES category (id),
    ADD INDEX idx_category_merge_target (merged_into_id);

ALTER TABLE tag
    ADD COLUMN merged_into_id BINARY(16) NULL AFTER status,
    ADD CONSTRAINT fk_tag_merge_target FOREIGN KEY (merged_into_id) REFERENCES tag (id),
    ADD INDEX idx_tag_merge_target (merged_into_id);

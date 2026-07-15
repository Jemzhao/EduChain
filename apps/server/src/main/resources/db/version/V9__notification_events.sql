ALTER TABLE notification
    DROP CHECK chk_notification_type,
    ADD CONSTRAINT chk_notification_type CHECK (
        notification_type IN (
            'COMMENT_REPLY',
            'RESOURCE_LIKED',
            'RESOURCE_COMMENT',
            'FOLLOWED_AUTHOR_PUBLISHED',
            'NEW_FOLLOWER',
            'RESOURCE_STATUS',
            'EVIDENCE_RESULT'
        )
    );

ALTER TABLE notification_preference
    DROP CHECK chk_notification_preference_type,
    ADD CONSTRAINT chk_notification_preference_type CHECK (
        notification_type IN (
            'COMMENT_REPLY',
            'RESOURCE_LIKED',
            'RESOURCE_COMMENT',
            'FOLLOWED_AUTHOR_PUBLISHED',
            'NEW_FOLLOWER',
            'RESOURCE_STATUS',
            'EVIDENCE_RESULT'
        )
    );

package com.educhain.notification.repository;

import com.educhain.notification.entity.NotificationPreferenceEntity;
import com.educhain.notification.entity.NotificationPreferenceKey;
import com.educhain.notification.domain.NotificationType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository
        extends JpaRepository<NotificationPreferenceEntity, NotificationPreferenceKey> {

    List<NotificationPreferenceEntity> findAllByUserId(UUID userId);

    Optional<NotificationPreferenceEntity> findByUserIdAndType(
            UUID userId,
            NotificationType type
    );
}

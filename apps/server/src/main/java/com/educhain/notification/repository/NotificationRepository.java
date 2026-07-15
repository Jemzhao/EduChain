package com.educhain.notification.repository;

import com.educhain.notification.entity.NotificationEntity;
import com.educhain.notification.domain.NotificationType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

    Optional<NotificationEntity> findByIdAndRecipientId(UUID id, UUID recipientId);

    boolean existsByRecipientIdAndDeduplicationKey(UUID recipientId, String deduplicationKey);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);

    Page<NotificationEntity> findAllByRecipientId(UUID recipientId, Pageable pageable);

    Page<NotificationEntity> findAllByRecipientIdAndType(
            UUID recipientId,
            NotificationType type,
            Pageable pageable
    );

    Page<NotificationEntity> findAllByRecipientIdAndReadAtIsNull(
            UUID recipientId,
            Pageable pageable
    );

    Page<NotificationEntity> findAllByRecipientIdAndReadAtIsNotNull(
            UUID recipientId,
            Pageable pageable
    );

    Page<NotificationEntity> findAllByRecipientIdAndTypeAndReadAtIsNull(
            UUID recipientId,
            NotificationType type,
            Pageable pageable
    );

    Page<NotificationEntity> findAllByRecipientIdAndTypeAndReadAtIsNotNull(
            UUID recipientId,
            NotificationType type,
            Pageable pageable
    );

    List<NotificationEntity> findAllByRecipientIdAndIdIn(UUID recipientId, Collection<UUID> ids);

    long deleteAllByRecipientId(UUID recipientId);

    long deleteAllByRecipientIdAndIdIn(UUID recipientId, Collection<UUID> ids);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update NotificationEntity notification
               set notification.readAt = :readAt
             where notification.recipientId = :recipientId
               and notification.readAt is null
            """)
    int markAllRead(@Param("recipientId") UUID recipientId, @Param("readAt") Instant readAt);
}

package com.educhain.notification.service;

import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.knowledge.service.KnowledgeReferenceSnapshot;
import com.educhain.notification.dto.NotificationListResponse;
import com.educhain.notification.dto.NotificationDeletionBatchRequest;
import com.educhain.notification.dto.NotificationDeletionBatchResponse;
import com.educhain.notification.dto.NotificationPreferenceListResponse;
import com.educhain.notification.dto.NotificationPreferenceResponse;
import com.educhain.notification.dto.NotificationReadBatchRequest;
import com.educhain.notification.dto.NotificationReadBatchResponse;
import com.educhain.notification.dto.NotificationReadBatchScope;
import com.educhain.notification.dto.NotificationResponse;
import com.educhain.notification.dto.UpdateNotificationPreferenceItemRequest;
import com.educhain.notification.dto.UpdateNotificationPreferencesRequest;
import com.educhain.notification.entity.NotificationEntity;
import com.educhain.notification.entity.NotificationPreferenceEntity;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.repository.NotificationPreferenceRepository;
import com.educhain.notification.repository.NotificationRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Base64;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final KnowledgeInteractionReadService knowledgeReadService;
    private final UserService userService;
    private final Clock clock;
    private final UserAccountRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository preferenceRepository,
            KnowledgeInteractionReadService knowledgeReadService,
            UserService userService,
            Clock clock,
            UserAccountRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.userService = userService;
        this.clock = clock;
        this.userRepository = userRepository;
    }

    @Transactional
    public void emit(NotificationIntent intent) {
        if (intent.recipientId().equals(intent.actorId())) return;
        boolean enabled = preferenceRepository
                .findByUserIdAndType(intent.recipientId(), intent.type())
                .map(NotificationPreferenceEntity::isInAppEnabled)
                .orElse(true);
        if (!enabled || notificationRepository.existsByRecipientIdAndDeduplicationKey(
                intent.recipientId(),
                intent.deduplicationKey()
        )) {
            return;
        }
        notificationRepository.save(new NotificationEntity(
                UUID.randomUUID(),
                intent.recipientId(),
                intent.type(),
                intent.deduplicationKey(),
                intent.actorId(),
                intent.resourceId(),
                intent.commentId()
        ));
    }

    @Transactional
    public int broadcast(UUID announcementId, String title, String body) {
        int created = 0;
        var recipients = userRepository.findAllByStatus(UserStatus.ACTIVE);
        for (var recipient : recipients) {
            boolean enabled = preferenceRepository
                    .findByUserIdAndType(recipient.getId(), NotificationType.SYSTEM_ANNOUNCEMENT)
                    .map(NotificationPreferenceEntity::isInAppEnabled)
                    .orElse(true);
            if (!enabled) continue;
            String key = "system-announcement:" + announcementId;
            if (notificationRepository.existsByRecipientIdAndDeduplicationKey(
                    recipient.getId(),
                    key
            )) continue;
            notificationRepository.save(new NotificationEntity(recipient.getId(), key, title, body));
            created++;
        }
        notificationRepository.flush();
        return created;
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(
            UUID userId,
            NotificationType type,
            Boolean read,
            String cursor,
            int limit
    ) {
        int pageIndex = decodeCursor(cursor);
        PageRequest pageRequest = PageRequest.of(
                pageIndex,
                limit,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
        Page<NotificationEntity> page = findPage(userId, type, read, pageRequest);
        return new NotificationListResponse(
                page.getContent().stream().map(this::toResponse).toList(),
                notificationRepository.countByRecipientIdAndReadAtIsNull(userId),
                new PageInfoResponse(
                        page.hasNext() ? encodeCursor(pageIndex + 1) : null,
                        page.hasNext()
                )
        );
    }

    @Transactional
    public NotificationResponse setRead(UUID userId, UUID notificationId, boolean read) {
        NotificationEntity notification = notificationRepository
                .findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(this::notFound);
        notification.setRead(read, clock.instant());
        return toResponse(notification);
    }

    @Transactional
    public NotificationReadBatchResponse markReadBatch(
            UUID userId,
            NotificationReadBatchRequest request
    ) {
        validateBatch(request);
        int updated;
        if (request.scope() == NotificationReadBatchScope.ALL) {
            updated = notificationRepository.markAllRead(userId, clock.instant());
        } else {
            List<NotificationEntity> notifications = notificationRepository
                    .findAllByRecipientIdAndIdIn(userId, request.notificationIds());
            updated = 0;
            for (NotificationEntity notification : notifications) {
                if (notification.getReadAt() != null) continue;
                notification.setRead(true, clock.instant());
                updated++;
            }
        }
        return new NotificationReadBatchResponse(
                updated,
                notificationRepository.countByRecipientIdAndReadAtIsNull(userId)
        );
    }

    @Transactional
    public void delete(UUID userId, UUID notificationId) {
        NotificationEntity notification = notificationRepository
                .findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(this::notFound);
        notificationRepository.delete(notification);
    }

    @Transactional
    public NotificationDeletionBatchResponse deleteBatch(
            UUID userId,
            NotificationDeletionBatchRequest request
    ) {
        validateDeletionBatch(request);
        long deleted = request.scope() == NotificationReadBatchScope.ALL
                ? notificationRepository.deleteAllByRecipientId(userId)
                : notificationRepository.deleteAllByRecipientIdAndIdIn(
                        userId,
                        request.notificationIds()
                );
        return new NotificationDeletionBatchResponse(
                Math.toIntExact(deleted),
                notificationRepository.countByRecipientIdAndReadAtIsNull(userId)
        );
    }

    @Transactional(readOnly = true)
    public NotificationPreferenceListResponse preferences(UUID userId) {
        Map<NotificationType, NotificationPreferenceEntity> existing = new EnumMap<>(
                NotificationType.class
        );
        preferenceRepository.findAllByUserId(userId)
                .forEach(preference -> existing.put(preference.getType(), preference));
        List<NotificationPreferenceResponse> items = new ArrayList<>();
        for (NotificationType type : NotificationType.values()) {
            NotificationPreferenceEntity preference = existing.get(type);
            items.add(new NotificationPreferenceResponse(
                    type,
                    preference == null || preference.isInAppEnabled(),
                    preference != null && preference.isExternalEnabled()
            ));
        }
        return new NotificationPreferenceListResponse(items);
    }

    @Transactional
    public NotificationPreferenceListResponse updatePreferences(
            UUID userId,
            UpdateNotificationPreferencesRequest request
    ) {
        validatePreferences(request.items());
        Map<NotificationType, NotificationPreferenceEntity> existing = new EnumMap<>(
                NotificationType.class
        );
        preferenceRepository.findAllByUserId(userId)
                .forEach(preference -> existing.put(preference.getType(), preference));
        for (UpdateNotificationPreferenceItemRequest item : request.items()) {
            NotificationPreferenceEntity preference = existing.computeIfAbsent(
                    item.type(),
                    type -> new NotificationPreferenceEntity(userId, type)
            );
            preference.update(item.inAppEnabled(), item.externalEnabled());
            preferenceRepository.save(preference);
        }
        return preferences(userId);
    }

    private Page<NotificationEntity> findPage(
            UUID userId,
            NotificationType type,
            Boolean read,
            PageRequest pageRequest
    ) {
        if (type != null && Boolean.TRUE.equals(read)) {
            return notificationRepository.findAllByRecipientIdAndTypeAndReadAtIsNotNull(
                    userId, type, pageRequest
            );
        }
        if (type != null && Boolean.FALSE.equals(read)) {
            return notificationRepository.findAllByRecipientIdAndTypeAndReadAtIsNull(
                    userId, type, pageRequest
            );
        }
        if (type != null) {
            return notificationRepository.findAllByRecipientIdAndType(userId, type, pageRequest);
        }
        if (Boolean.TRUE.equals(read)) {
            return notificationRepository.findAllByRecipientIdAndReadAtIsNotNull(
                    userId, pageRequest
            );
        }
        if (Boolean.FALSE.equals(read)) {
            return notificationRepository.findAllByRecipientIdAndReadAtIsNull(
                    userId, pageRequest
            );
        }
        return notificationRepository.findAllByRecipientId(userId, pageRequest);
    }

    private NotificationResponse toResponse(NotificationEntity notification) {
        ResourceAuthorResponse actor = null;
        if (notification.getActorId() != null) {
            PublicAuthorSnapshot snapshot = userService.getPublicAuthor(notification.getActorId());
            actor = new ResourceAuthorResponse(
                    snapshot.id(),
                    snapshot.handle(),
                    snapshot.displayName(),
                    snapshot.avatarUrl()
            );
        }
        KnowledgeReferenceSnapshot resource = notification.getResourceId() == null
                ? null
                : knowledgeReadService.findReference(notification.getResourceId()).orElse(null);
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                actor,
                resource == null ? null : resource.id(),
                resource == null ? null : resource.slug(),
                resource == null ? null : resource.title(),
                notification.getCommentId(),
                notification.getSystemTitle(),
                notification.getSystemBody(),
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }

    private void validateBatch(NotificationReadBatchRequest request) {
        boolean allValid = request.scope() == NotificationReadBatchScope.ALL
                && request.notificationIds().isEmpty();
        boolean selectedValid = request.scope() == NotificationReadBatchScope.SELECTED
                && !request.notificationIds().isEmpty()
                && new HashSet<>(request.notificationIds()).size() == request.notificationIds().size();
        if (!allValid && !selectedValid) throw invalidBatch();
    }

    private void validateDeletionBatch(NotificationDeletionBatchRequest request) {
        boolean allValid = request.scope() == NotificationReadBatchScope.ALL
                && request.notificationIds().isEmpty();
        boolean selectedValid = request.scope() == NotificationReadBatchScope.SELECTED
                && !request.notificationIds().isEmpty()
                && new HashSet<>(request.notificationIds()).size() == request.notificationIds().size();
        if (!allValid && !selectedValid) throw invalidBatch();
    }

    private void validatePreferences(List<UpdateNotificationPreferenceItemRequest> items) {
        EnumSet<NotificationType> types = EnumSet.noneOf(NotificationType.class);
        items.forEach(item -> types.add(item.type()));
        if (!types.equals(EnumSet.allOf(NotificationType.class)) || types.size() != items.size()) {
            throw invalidBatch();
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(cursor),
                    StandardCharsets.UTF_8
            );
            if (!decoded.startsWith("page:")) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(5));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("page:" + page).getBytes(StandardCharsets.UTF_8));
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Notification was not found",
                false,
                Map.of()
        );
    }

    private ApiException invalidBatch() {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.NOTIFICATION_BATCH_INVALID,
                "Notification batch or preference snapshot is invalid",
                false,
                Map.of()
        );
    }
}

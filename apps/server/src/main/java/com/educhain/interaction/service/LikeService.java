package com.educhain.interaction.service;

import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.service.ActivityService;
import com.educhain.interaction.dto.LikeStateResponse;
import com.educhain.interaction.entity.ResourceLikeEntity;
import com.educhain.interaction.repository.ResourceLikeRepository;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.knowledge.service.InteractiveResourceSnapshot;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

    private final ResourceLikeRepository likeRepository;
    private final KnowledgeInteractionReadService knowledgeReadService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    public LikeService(
            ResourceLikeRepository likeRepository,
            KnowledgeInteractionReadService knowledgeReadService,
            ActivityService activityService,
            NotificationService notificationService
    ) {
        this.likeRepository = likeRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.activityService = activityService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public LikeStateResponse state(UUID userId, UUID resourceId) {
        knowledgeReadService.requireInteractive(resourceId);
        return response(userId, resourceId);
    }

    @Transactional
    public LikeStateResponse setState(UUID userId, UUID resourceId, boolean liked) {
        InteractiveResourceSnapshot resource = knowledgeReadService.requireInteractive(resourceId);
        boolean current = likeRepository.existsByUserIdAndResourceId(userId, resourceId);
        if (liked && !current) {
            likeRepository.save(new ResourceLikeEntity(userId, resourceId));
            activityService.record(userId, ActivityType.LIKED_RESOURCE, resourceId);
            notificationService.emit(new NotificationIntent(
                    resource.authorId(),
                    NotificationType.RESOURCE_LIKED,
                    "resource-liked:" + resourceId + ":" + userId,
                    userId,
                    resourceId,
                    null
            ));
        } else if (!liked && current) {
            likeRepository.deleteByUserIdAndResourceId(userId, resourceId);
        }
        return response(userId, resourceId);
    }

    @Transactional(readOnly = true)
    public long count(UUID resourceId) {
        return likeRepository.countByResourceId(resourceId);
    }

    private LikeStateResponse response(UUID userId, UUID resourceId) {
        return new LikeStateResponse(
                resourceId,
                likeRepository.existsByUserIdAndResourceId(userId, resourceId),
                likeRepository.countByResourceId(resourceId)
        );
    }
}

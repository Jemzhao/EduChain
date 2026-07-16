package com.educhain.activity.service;

import com.educhain.activity.dto.ActivityItemResponse;
import com.educhain.activity.dto.ActivityListResponse;
import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.entity.UserActivityEntity;
import com.educhain.activity.repository.UserActivityRepository;
import java.time.Clock;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {

    private final UserActivityRepository repository;
    private final Clock clock;

    public ActivityService(UserActivityRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public void record(UUID userId, ActivityType type, UUID resourceId) {
        if (userId != null) {
            repository.save(new UserActivityEntity(userId, type, resourceId, clock.instant()));
        }
    }

    @Transactional(readOnly = true)
    public ActivityListResponse list(UUID userId, int limit) {
        return new ActivityListResponse(repository
                .findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, limit))
                .stream()
                .map(event -> new ActivityItemResponse(
                        event.getId(),
                        event.getType(),
                        event.getResourceId(),
                        event.getCreatedAt()
                ))
                .toList());
    }
}

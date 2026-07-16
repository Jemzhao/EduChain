package com.educhain.activity.repository;

import com.educhain.activity.entity.UserActivityEntity;
import com.educhain.activity.domain.ActivityType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivityEntity, UUID> {
    List<UserActivityEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndType(UUID userId, ActivityType type);
}

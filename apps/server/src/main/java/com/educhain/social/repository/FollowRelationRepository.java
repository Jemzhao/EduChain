package com.educhain.social.repository;

import com.educhain.social.entity.FollowRelationEntity;
import com.educhain.social.entity.FollowRelationKey;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRelationRepository
        extends JpaRepository<FollowRelationEntity, FollowRelationKey> {

    boolean existsByFollowerIdAndFollowedId(UUID followerId, UUID followedId);

    long countByFollowedId(UUID followedId);

    long countByFollowerId(UUID followerId);

    Page<FollowRelationEntity> findAllByFollowedId(UUID followedId, Pageable pageable);

    Page<FollowRelationEntity> findAllByFollowerId(UUID followerId, Pageable pageable);

    List<FollowRelationEntity> findAllByFollowedId(UUID followedId);

    List<FollowRelationEntity> findAllByFollowerId(UUID followerId);

    void deleteByFollowerIdAndFollowedId(UUID followerId, UUID followedId);
}

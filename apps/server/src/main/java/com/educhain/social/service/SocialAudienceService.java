package com.educhain.social.service;

import com.educhain.social.entity.FollowRelationEntity;
import com.educhain.social.repository.FollowRelationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialAudienceService {

    private final FollowRelationRepository followRepository;

    public SocialAudienceService(FollowRelationRepository followRepository) {
        this.followRepository = followRepository;
    }

    @Transactional(readOnly = true)
    public List<UUID> followerIds(UUID authorId) {
        return followRepository.findAllByFollowedId(authorId)
                .stream()
                .map(FollowRelationEntity::getFollowerId)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> followedIds(UUID userId) {
        return followRepository.findAllByFollowerId(userId)
                .stream()
                .map(FollowRelationEntity::getFollowedId)
                .toList();
    }
}

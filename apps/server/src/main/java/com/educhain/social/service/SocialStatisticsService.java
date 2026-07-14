package com.educhain.social.service;

import com.educhain.social.repository.FollowRelationRepository;
import com.educhain.platform.contract.FollowStatistics;
import com.educhain.platform.port.SocialStatisticsPort;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialStatisticsService implements SocialStatisticsPort {

    private final FollowRelationRepository followRepository;

    public SocialStatisticsService(FollowRelationRepository followRepository) {
        this.followRepository = followRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FollowStatistics statistics(UUID userId) {
        return new FollowStatistics(
                followRepository.countByFollowedId(userId),
                followRepository.countByFollowerId(userId)
        );
    }
}

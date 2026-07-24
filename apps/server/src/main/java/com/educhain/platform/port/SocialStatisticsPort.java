package com.educhain.platform.port;

import com.educhain.platform.contract.FollowStatistics;
import java.util.UUID;

public interface SocialStatisticsPort {

    FollowStatistics statistics(UUID userId);
}

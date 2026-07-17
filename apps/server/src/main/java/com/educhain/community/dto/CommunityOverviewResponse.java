package com.educhain.community.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import java.util.List;

public record CommunityOverviewResponse(
        CommunityStatisticsResponse statistics,
        List<CommunityTopicResponse> topics,
        List<CommunityCreatorResponse> activeCreators,
        List<CommunityFeedItemResponse> feed,
        PageInfoResponse page,
        CommunityFeedScope effectiveScope
) {
    public CommunityOverviewResponse {
        topics = List.copyOf(topics);
        activeCreators = List.copyOf(activeCreators);
        feed = List.copyOf(feed);
    }
}

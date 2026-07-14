package com.educhain.social.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import java.util.List;

public record FollowUserListResponse(
        List<ResourceAuthorResponse> items,
        PageInfoResponse page
) {
}

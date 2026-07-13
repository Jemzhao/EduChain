package com.educhain.interaction.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import java.util.List;

public record CommentThreadListResponse(
        List<CommentThreadResponse> items,
        long totalCount,
        PageInfoResponse page
) {
}

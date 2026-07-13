package com.educhain.interaction.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import java.util.List;

public record CollectionItemListResponse(
        CollectionResponse collection,
        List<CollectionItemResponse> items,
        PageInfoResponse page
) {
}

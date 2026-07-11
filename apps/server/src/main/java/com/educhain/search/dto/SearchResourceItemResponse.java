package com.educhain.search.dto;

import com.educhain.knowledge.dto.ResourceCardResponse;
import java.util.List;

public record SearchResourceItemResponse(
        ResourceCardResponse resource,
        List<MatchedField> matchedFields,
        List<SearchHighlightResponse> highlights,
        List<RankingSignal> rankingSignals
) {
    public SearchResourceItemResponse {
        matchedFields = List.copyOf(matchedFields);
        highlights = List.copyOf(highlights);
        rankingSignals = List.copyOf(rankingSignals);
    }
}

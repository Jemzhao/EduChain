package com.educhain.search.dto;

import java.util.List;

public record SearchSuggestionResponse(List<String> items) {
    public SearchSuggestionResponse {
        items = List.copyOf(items);
    }
}

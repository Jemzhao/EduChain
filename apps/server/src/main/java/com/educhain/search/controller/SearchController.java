package com.educhain.search.controller;

import com.educhain.knowledge.dto.ResourceSort;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.search.dto.PopularSearchKeywordListResponse;
import com.educhain.search.dto.SearchResourceResponse;
import com.educhain.search.dto.SearchSuggestionResponse;
import com.educhain.search.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/resources")
    public SearchResourceResponse resources(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "") @Size(max = 200) String query,
            @RequestParam(required = false) @Size(max = 80) String category,
            @RequestParam(required = false) @Size(max = 5) List<@Size(max = 80) String> tags,
            @RequestParam(required = false) @Size(max = 32) String author,
            @RequestParam(defaultValue = "RELEVANCE") ResourceSort sort,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return searchService.search(
                principal == null ? null : principal.userId(),
                query,
                category,
                tags,
                author,
                sort,
                cursor,
                limit
        );
    }

    @GetMapping("/suggestions")
    public SearchSuggestionResponse suggestions(
            @RequestParam @Size(min = 2, max = 60) String query
    ) {
        return searchService.suggestions(query);
    }

    @GetMapping("/popular-keywords")
    public PopularSearchKeywordListResponse popularKeywords(
            @RequestParam(defaultValue = "10") @Min(1) @Max(20) int limit
    ) {
        return searchService.popularKeywords(limit);
    }
}

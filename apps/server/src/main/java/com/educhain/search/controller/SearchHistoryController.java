package com.educhain.search.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.search.dto.SearchHistoryResponse;
import com.educhain.search.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/users/me/search-history")
public class SearchHistoryController {

    private final SearchService searchService;

    public SearchHistoryController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchHistoryResponse history(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return searchService.history(principal.userId(), limit);
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@AuthenticationPrincipal EduChainPrincipal principal) {
        searchService.clearHistory(principal.userId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID historyId
    ) {
        searchService.deleteHistory(principal.userId(), historyId);
        return ResponseEntity.noContent().build();
    }
}

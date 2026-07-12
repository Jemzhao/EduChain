package com.educhain.discovery.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.discovery.dto.BrowsingHistoryResponse;
import com.educhain.discovery.dto.RecordResourceViewRequest;
import com.educhain.discovery.dto.ResourceStatisticsResponse;
import com.educhain.discovery.dto.ResourceViewResponse;
import com.educhain.discovery.dto.RecommendationFeedbackResponse;
import com.educhain.discovery.service.ResourceDiscoveryService;
import com.educhain.knowledge.dto.ResourceListResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class DiscoveryController {

    private final ResourceDiscoveryService service;

    public DiscoveryController(ResourceDiscoveryService service) {
        this.service = service;
    }

    @PostMapping("/resources/{resourceId}/views")
    public ResourceViewResponse view(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody RecordResourceViewRequest request
    ) {
        return service.recordView(principal == null ? null : principal.userId(), resourceId, request.viewerKey());
    }

    @GetMapping("/resources/{resourceId}/statistics")
    public ResourceStatisticsResponse statistics(@PathVariable UUID resourceId) {
        return service.statistics(resourceId);
    }

    @GetMapping("/users/me/history")
    public BrowsingHistoryResponse history(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.history(principal.userId(), limit);
    }

    @DeleteMapping("/users/me/history")
    public ResponseEntity<Void> clearHistory(@AuthenticationPrincipal EduChainPrincipal principal) {
        service.clearHistory(principal.userId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recommendations/resources")
    public ResourceListResponse recommendations(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(defaultValue = "12") @Min(1) @Max(30) int limit
    ) {
        return service.recommendations(principal == null ? null : principal.userId(), limit);
    }

    @PutMapping("/recommendations/resources/{resourceId}/feedback")
    public RecommendationFeedbackResponse dismissRecommendation(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId
    ) {
        return service.dismissRecommendation(principal.userId(), resourceId);
    }
}

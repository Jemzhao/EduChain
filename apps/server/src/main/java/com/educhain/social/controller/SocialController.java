package com.educhain.social.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.social.dto.FollowStateRequest;
import com.educhain.social.dto.FollowStateResponse;
import com.educhain.social.dto.FollowUserListResponse;
import com.educhain.social.service.SocialService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/users/{userId}")
public class SocialController {

    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }

    @GetMapping("/follow")
    public FollowStateResponse state(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId
    ) {
        return socialService.state(principal.userId(), userId);
    }

    @PutMapping("/follow")
    public FollowStateResponse setState(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId,
            @Valid @RequestBody FollowStateRequest request
    ) {
        return socialService.setState(principal.userId(), userId, request.following());
    }

    @GetMapping("/followers")
    public FollowUserListResponse followers(
            @PathVariable UUID userId,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return socialService.followers(userId, cursor, limit);
    }

    @GetMapping("/following")
    public FollowUserListResponse following(
            @PathVariable UUID userId,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return socialService.following(userId, cursor, limit);
    }
}

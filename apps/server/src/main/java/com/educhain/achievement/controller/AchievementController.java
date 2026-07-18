package com.educhain.achievement.controller;

import com.educhain.achievement.dto.AchievementCatalogResponse;
import com.educhain.achievement.dto.AchievementProfileResponse;
import com.educhain.achievement.dto.LeaderboardResponse;
import com.educhain.achievement.service.AchievementService;
import com.educhain.platform.security.EduChainPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class AchievementController {

    private final AchievementService service;

    public AchievementController(AchievementService service) {
        this.service = service;
    }

    @GetMapping("/achievements")
    public AchievementCatalogResponse catalog() {
        return service.catalog();
    }

    @GetMapping("/users/me/achievements")
    public AchievementProfileResponse profile(@AuthenticationPrincipal EduChainPrincipal principal) {
        return service.profile(principal.userId());
    }

    @GetMapping("/leaderboards/contributors")
    public LeaderboardResponse leaderboard(
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.leaderboard(limit);
    }
}

package com.educhain.platform.controller;

import com.educhain.platform.dto.PlatformSettingListResponse;
import com.educhain.platform.service.PlatformSettingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform-settings")
public class PlatformSettingController {

    private final PlatformSettingService service;

    public PlatformSettingController(PlatformSettingService service) {
        this.service = service;
    }

    @GetMapping
    public PlatformSettingListResponse settings() {
        return service.publicSettings();
    }
}

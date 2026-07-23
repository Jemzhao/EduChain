package com.educhain.externalcontent.controller;

import com.educhain.externalcontent.dto.ExternalContentModels;
import com.educhain.externalcontent.service.ExternalContentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/external-content")
public class ExternalContentController {
    private final ExternalContentService content;

    public ExternalContentController(ExternalContentService content) {
        this.content = content;
    }

    @GetMapping
    public ExternalContentModels.ItemListResponse list(
            @RequestParam(defaultValue = "") @Size(max = 120) String query,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return content.publicItems(query, limit);
    }
}

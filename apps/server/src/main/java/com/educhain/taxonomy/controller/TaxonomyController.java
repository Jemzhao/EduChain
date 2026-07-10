package com.educhain.taxonomy.controller;

import com.educhain.taxonomy.dto.CategoryListResponse;
import com.educhain.taxonomy.dto.TagListResponse;
import com.educhain.taxonomy.service.TaxonomyService;
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
@RequestMapping("/api/v1")
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    public TaxonomyController(TaxonomyService taxonomyService) {
        this.taxonomyService = taxonomyService;
    }

    @GetMapping("/categories")
    public CategoryListResponse categories() {
        return taxonomyService.categories();
    }

    @GetMapping("/tags")
    public TagListResponse tags(
            @RequestParam(defaultValue = "") @Size(max = 60) String query,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return taxonomyService.tags(query, limit);
    }
}

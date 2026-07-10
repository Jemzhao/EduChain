package com.educhain.taxonomy.service;

import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.taxonomy.dto.CategoryListResponse;
import com.educhain.taxonomy.dto.CategoryResponse;
import com.educhain.taxonomy.dto.TagListResponse;
import com.educhain.taxonomy.dto.TagResponse;
import com.educhain.taxonomy.entity.CategoryEntity;
import com.educhain.taxonomy.entity.TagEntity;
import com.educhain.taxonomy.domain.TaxonomyStatus;
import com.educhain.taxonomy.repository.CategoryRepository;
import com.educhain.taxonomy.repository.TagRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaxonomyService {

    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public TaxonomyService(CategoryRepository categoryRepository, TagRepository tagRepository) {
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
    }

    @Transactional(readOnly = true)
    public CategoryListResponse categories() {
        List<CategoryEntity> categories = categoryRepository
                .findAllByStatusOrderBySortOrderAsc(TaxonomyStatus.ACTIVE);
        Map<UUID, List<CategoryEntity>> children = new HashMap<>();
        for (CategoryEntity category : categories) {
            children.computeIfAbsent(category.getParentId(), ignored -> new ArrayList<>())
                    .add(category);
        }
        return new CategoryListResponse(children.getOrDefault(null, List.of()).stream()
                .map(category -> toCategory(category, children))
                .toList());
    }

    @Transactional(readOnly = true)
    public TagListResponse tags(String query, int limit) {
        String normalized = query == null ? "" : query.trim();
        return new TagListResponse(tagRepository
                .findAllByStatusAndCanonicalNameContainingIgnoreCaseOrderByCanonicalNameAsc(
                        TaxonomyStatus.ACTIVE,
                        normalized,
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(this::toTag)
                .toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse requireCategory(UUID categoryId) {
        CategoryEntity category = resolveCategory(categoryId);
        return toCategory(category, Map.of());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> requireTags(Collection<UUID> tagIds) {
        LinkedHashSet<UUID> uniqueIds = new LinkedHashSet<>(tagIds);
        var canonical = new java.util.LinkedHashMap<UUID, TagResponse>();
        uniqueIds.stream().map(this::resolveTag).forEach(tag -> canonical.putIfAbsent(
                tag.getId(),
                toTag(tag)
        ));
        return List.copyOf(canonical.values());
    }

    @Transactional(readOnly = true)
    public Map<UUID, CategoryResponse> requireCategories(Collection<UUID> categoryIds) {
        LinkedHashSet<UUID> uniqueIds = new LinkedHashSet<>(categoryIds);
        Map<UUID, CategoryResponse> result = new HashMap<>();
        uniqueIds.forEach(id -> result.put(id, toCategory(resolveCategory(id), Map.of())));
        return Map.copyOf(result);
    }

    @Transactional(readOnly = true)
    public Map<UUID, TagResponse> requireTagMap(Collection<UUID> tagIds) {
        Map<UUID, TagResponse> result = new HashMap<>();
        new LinkedHashSet<>(tagIds).forEach(id -> result.put(id, toTag(resolveTag(id))));
        return Map.copyOf(result);
    }

    private CategoryEntity resolveCategory(UUID categoryId) {
        UUID current = categoryId;
        var visited = new LinkedHashSet<UUID>();
        while (visited.add(current)) {
            CategoryEntity category = categoryRepository.findById(current).orElseThrow(
                    () -> unavailable(ErrorCode.CATEGORY_UNAVAILABLE, "Category is unavailable")
            );
            if (category.getStatus() == TaxonomyStatus.ACTIVE) return category;
            if (category.getMergedIntoId() == null) break;
            current = category.getMergedIntoId();
        }
        throw unavailable(ErrorCode.CATEGORY_UNAVAILABLE, "Category is unavailable");
    }

    private TagEntity resolveTag(UUID tagId) {
        UUID current = tagId;
        var visited = new LinkedHashSet<UUID>();
        while (visited.add(current)) {
            TagEntity tag = tagRepository.findById(current).orElseThrow(
                    () -> unavailable(ErrorCode.TAG_UNAVAILABLE, "Tag is unavailable")
            );
            if (tag.getStatus() == TaxonomyStatus.ACTIVE) return tag;
            if (tag.getMergedIntoId() == null) break;
            current = tag.getMergedIntoId();
        }
        throw unavailable(ErrorCode.TAG_UNAVAILABLE, "Tag is unavailable");
    }

    private CategoryResponse toCategory(
            CategoryEntity category,
            Map<UUID, List<CategoryEntity>> childMap
    ) {
        return new CategoryResponse(
                category.getId(),
                category.getSlug(),
                category.getNameKey(),
                category.getDescriptionKey(),
                category.getSortOrder(),
                childMap.getOrDefault(category.getId(), List.of()).stream()
                        .map(child -> toCategory(child, childMap))
                        .toList()
        );
    }

    private TagResponse toTag(TagEntity tag) {
        return new TagResponse(tag.getId(), tag.getSlug(), tag.getCanonicalName());
    }

    private ApiException unavailable(ErrorCode code, String title) {
        return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, code, title, false, Map.of());
    }
}

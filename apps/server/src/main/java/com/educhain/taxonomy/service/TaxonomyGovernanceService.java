package com.educhain.taxonomy.service;

import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.knowledge.repository.KnowledgeVersionTagRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.taxonomy.entity.CategoryEntity;
import com.educhain.taxonomy.entity.TagEntity;
import com.educhain.taxonomy.domain.TaxonomyStatus;
import com.educhain.taxonomy.repository.CategoryRepository;
import com.educhain.taxonomy.repository.TagRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaxonomyGovernanceService {

    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final KnowledgeVersionTagRepository versionTagRepository;

    public TaxonomyGovernanceService(
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            KnowledgeVersionRepository versionRepository,
            KnowledgeVersionTagRepository versionTagRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.versionRepository = versionRepository;
        this.versionTagRepository = versionTagRepository;
    }

    @Transactional(readOnly = true)
    public List<GovernanceTaxonomyView> list() {
        List<GovernanceTaxonomyView> items = new ArrayList<>();
        categoryRepository.findAllByOrderBySortOrderAscSlugAsc()
                .forEach(category -> items.add(categoryView(category)));
        tagRepository.findAllByOrderByCanonicalNameAsc()
                .forEach(tag -> items.add(tagView(tag)));
        return List.copyOf(items);
    }

    @Transactional
    public GovernanceTaxonomyView changeCategoryStatus(
            UUID categoryId,
            long expectedVersion,
            TaxonomyStatus status
    ) {
        CategoryEntity category = categoryRepository.findById(categoryId).orElseThrow(this::notFound);
        validateVersion(category.getVersion(), expectedVersion);
        validateNotMerged(category.getMergedIntoId(), status);
        long references = versionRepository.countByCategoryId(categoryId);
        validateDisable(status, references);
        category.changeStatus(status);
        categoryRepository.flush();
        return categoryView(category);
    }

    @Transactional
    public GovernanceTaxonomyView mergeCategory(
            UUID categoryId,
            long expectedVersion,
            UUID targetId
    ) {
        CategoryEntity source = categoryRepository.findById(categoryId).orElseThrow(this::notFound);
        validateVersion(source.getVersion(), expectedVersion);
        CategoryEntity target = categoryRepository.findById(targetId).orElseThrow(this::notFound);
        if (source.getId().equals(target.getId()) || target.getStatus() != TaxonomyStatus.ACTIVE) {
            throw invalidMerge();
        }
        requireNoCategoryCycle(target.getId(), source.getId());
        source.mergeInto(targetId);
        categoryRepository.flush();
        return categoryView(source);
    }

    @Transactional
    public GovernanceTaxonomyView createCategory(
            String slug,
            String label,
            String description,
            UUID parentId,
            int sortOrder
    ) {
        String normalizedSlug = normalizeSlug(slug);
        if (categoryRepository.existsBySlug(normalizedSlug)) {
            throw duplicate();
        }
        requireParent(parentId, null);
        CategoryEntity category = categoryRepository.save(new CategoryEntity(
                UUID.randomUUID(),
                parentId,
                normalizedSlug,
                normalizeLabel(label),
                description.trim(),
                sortOrder
        ));
        categoryRepository.flush();
        return categoryView(category);
    }

    @Transactional
    public GovernanceTaxonomyView updateCategory(
            UUID categoryId,
            long expectedVersion,
            String slug,
            String label,
            String description,
            UUID parentId,
            int sortOrder
    ) {
        CategoryEntity category = categoryRepository.findById(categoryId).orElseThrow(this::notFound);
        validateVersion(category.getVersion(), expectedVersion);
        String normalizedSlug = normalizeSlug(slug);
        if (categoryRepository.existsBySlugAndIdNot(normalizedSlug, categoryId)) {
            throw duplicate();
        }
        long references = versionRepository.countByCategoryId(categoryId);
        if (references > 0 && !category.getSlug().equals(normalizedSlug)) {
            throw immutableSlug();
        }
        requireParent(parentId, categoryId);
        category.update(
                parentId,
                normalizedSlug,
                normalizeLabel(label),
                description.trim(),
                sortOrder
        );
        categoryRepository.flush();
        return categoryView(category);
    }

    @Transactional
    public GovernanceTaxonomyView changeTagStatus(
            UUID tagId,
            long expectedVersion,
            TaxonomyStatus status
    ) {
        TagEntity tag = tagRepository.findById(tagId).orElseThrow(this::notFound);
        validateVersion(tag.getVersion(), expectedVersion);
        validateNotMerged(tag.getMergedIntoId(), status);
        long references = versionTagRepository.countByTagId(tagId);
        validateDisable(status, references);
        tag.changeStatus(status);
        tagRepository.flush();
        return tagView(tag);
    }

    @Transactional
    public GovernanceTaxonomyView mergeTag(UUID tagId, long expectedVersion, UUID targetId) {
        TagEntity source = tagRepository.findById(tagId).orElseThrow(this::notFound);
        validateVersion(source.getVersion(), expectedVersion);
        TagEntity target = tagRepository.findById(targetId).orElseThrow(this::notFound);
        if (source.getId().equals(target.getId()) || target.getStatus() != TaxonomyStatus.ACTIVE) {
            throw invalidMerge();
        }
        source.mergeInto(targetId);
        tagRepository.flush();
        return tagView(source);
    }

    @Transactional
    public GovernanceTaxonomyView createTag(String slug, String label, String description) {
        String normalizedSlug = normalizeSlug(slug);
        if (tagRepository.existsBySlug(normalizedSlug)) {
            throw duplicate();
        }
        TagEntity tag = tagRepository.save(new TagEntity(
                UUID.randomUUID(),
                normalizedSlug,
                normalizeLabel(label),
                description.trim()
        ));
        tagRepository.flush();
        return tagView(tag);
    }

    @Transactional
    public GovernanceTaxonomyView updateTag(
            UUID tagId,
            long expectedVersion,
            String slug,
            String label,
            String description
    ) {
        TagEntity tag = tagRepository.findById(tagId).orElseThrow(this::notFound);
        validateVersion(tag.getVersion(), expectedVersion);
        String normalizedSlug = normalizeSlug(slug);
        if (tagRepository.existsBySlugAndIdNot(normalizedSlug, tagId)) {
            throw duplicate();
        }
        long references = versionTagRepository.countByTagId(tagId);
        if (references > 0 && !tag.getSlug().equals(normalizedSlug)) {
            throw immutableSlug();
        }
        tag.update(normalizedSlug, normalizeLabel(label), description.trim());
        tagRepository.flush();
        return tagView(tag);
    }

    @Transactional
    public void deleteCategory(UUID categoryId, long expectedVersion) {
        CategoryEntity category = categoryRepository.findById(categoryId).orElseThrow(this::notFound);
        validateVersion(category.getVersion(), expectedVersion);
        long references = versionRepository.countByCategoryId(categoryId);
        if (category.getStatus() != TaxonomyStatus.DISABLED
                || references > 0
                || categoryRepository.existsByParentId(categoryId)) {
            throw deletionNotAllowed(references);
        }
        categoryRepository.delete(category);
        categoryRepository.flush();
    }

    @Transactional
    public void deleteTag(UUID tagId, long expectedVersion) {
        TagEntity tag = tagRepository.findById(tagId).orElseThrow(this::notFound);
        validateVersion(tag.getVersion(), expectedVersion);
        long references = versionTagRepository.countByTagId(tagId);
        if (tag.getStatus() != TaxonomyStatus.DISABLED || references > 0) {
            throw deletionNotAllowed(references);
        }
        tagRepository.delete(tag);
        tagRepository.flush();
    }

    private void requireParent(UUID parentId, UUID categoryId) {
        if (parentId == null) return;
        if (parentId.equals(categoryId) || categoryRepository.findById(parentId).isEmpty()) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FIELD_VALIDATION_FAILED,
                    "Category parent is invalid",
                    false,
                    Map.of("parentId", "FIELD_REFERENCE_INVALID")
            );
        }
        requireNoCategoryCycle(parentId, categoryId);
    }

    private void requireNoCategoryCycle(UUID candidateParentId, UUID categoryId) {
        if (categoryId == null) return;
        UUID current = candidateParentId;
        var visited = new java.util.HashSet<UUID>();
        while (current != null) {
            if (!visited.add(current) || current.equals(categoryId)) throw invalidMerge();
            current = categoryRepository.findById(current).map(CategoryEntity::getParentId).orElse(null);
        }
    }

    private String normalizeSlug(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeLabel(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private ApiException duplicate() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                "Taxonomy slug is already in use",
                false,
                Map.of()
        );
    }

    private ApiException immutableSlug() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                "A referenced taxonomy slug cannot be changed",
                false,
                Map.of()
        );
    }

    private GovernanceTaxonomyView categoryView(CategoryEntity category) {
        return new GovernanceTaxonomyView(
                category.getId(),
                "CATEGORY",
                category.getSlug(),
                category.getNameKey(),
                category.getDescriptionKey(),
                category.getParentId(),
                category.getSortOrder(),
                category.getStatus(),
                category.getMergedIntoId(),
                category.getVersion(),
                versionRepository.countByCategoryId(category.getId())
        );
    }

    private GovernanceTaxonomyView tagView(TagEntity tag) {
        return new GovernanceTaxonomyView(
                tag.getId(),
                "TAG",
                tag.getSlug(),
                tag.getCanonicalName(),
                tag.getDescription(),
                null,
                null,
                tag.getStatus(),
                tag.getMergedIntoId(),
                tag.getVersion(),
                versionTagRepository.countByTagId(tag.getId())
        );
    }

    private void validateVersion(long current, long expected) {
        if (current != expected) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Taxonomy version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(current))
            );
        }
    }

    private void validateDisable(TaxonomyStatus status, long references) {
        if (status == TaxonomyStatus.DISABLED && references > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "Referenced taxonomy cannot be disabled without a merge target",
                    false,
                    Map.of("referenceCount", Long.toString(references))
            );
        }
    }

    private void validateNotMerged(UUID mergedIntoId, TaxonomyStatus status) {
        if (mergedIntoId != null && status == TaxonomyStatus.ACTIVE) throw invalidMerge();
    }

    private ApiException invalidMerge() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                "Taxonomy merge target is invalid",
                false,
                Map.of()
        );
    }

    private ApiException deletionNotAllowed(long references) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                "Only disabled and unreferenced taxonomy can be removed",
                false,
                Map.of("referenceCount", Long.toString(references))
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Taxonomy item was not found",
                false,
                Map.of()
        );
    }
}

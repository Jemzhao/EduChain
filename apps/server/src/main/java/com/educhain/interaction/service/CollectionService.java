package com.educhain.interaction.service;

import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.service.ActivityService;
import com.educhain.interaction.dto.CollectionItemListResponse;
import com.educhain.interaction.dto.CollectionItemResponse;
import com.educhain.interaction.dto.CollectionListResponse;
import com.educhain.interaction.dto.CollectionMembershipResponse;
import com.educhain.interaction.dto.CollectionResponse;
import com.educhain.interaction.entity.CollectionEntity;
import com.educhain.interaction.entity.CollectionItemEntity;
import com.educhain.interaction.repository.CollectionItemRepository;
import com.educhain.interaction.repository.CollectionRepository;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.service.InteractiveResourceSnapshot;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CollectionService {

    private static final String DEFAULT_NAME_NORMALIZED = "__default__";

    private final CollectionRepository collectionRepository;
    private final CollectionItemRepository itemRepository;
    private final KnowledgeInteractionReadService knowledgeReadService;
    private final IdempotencyService idempotencyService;
    private final EntityManager entityManager;
    private final ActivityService activityService;

    public CollectionService(
            CollectionRepository collectionRepository,
            CollectionItemRepository itemRepository,
            KnowledgeInteractionReadService knowledgeReadService,
            IdempotencyService idempotencyService,
            EntityManager entityManager,
            ActivityService activityService
    ) {
        this.collectionRepository = collectionRepository;
        this.itemRepository = itemRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.idempotencyService = idempotencyService;
        this.entityManager = entityManager;
        this.activityService = activityService;
    }

    @Transactional
    public CollectionListResponse list(UUID ownerId, UUID resourceId) {
        ensureDefault(ownerId);
        return new CollectionListResponse(collectionRepository
                .findAllByOwnerIdOrderByDefaultCollectionDescCreatedAtAsc(ownerId)
                .stream()
                .map(collection -> response(collection, resourceId))
                .toList());
    }

    @Transactional
    public CollectionResponse create(UUID ownerId, String idempotencyKey, String requestedName) {
        String name = normalizeDisplayName(requestedName);
        String normalized = normalizeName(name);
        String scope = "COLLECTION_CREATE:" + ownerId;
        Optional<String> replay = idempotencyService.begin(
                scope,
                idempotencyKey,
                digest(normalized)
        );
        if (replay.isPresent()) {
            return response(requireOwned(ownerId, UUID.fromString(replay.orElseThrow())), null);
        }
        if (collectionRepository.existsByOwnerIdAndNameNormalized(ownerId, normalized)) {
            throw nameTaken();
        }
        CollectionEntity collection = collectionRepository.save(new CollectionEntity(
                UUID.randomUUID(),
                ownerId,
                name,
                normalized,
                false
        ));
        idempotencyService.complete(
                scope,
                idempotencyKey,
                ownerId,
                collection.getId().toString(),
                HttpStatus.CREATED.value()
        );
        entityManager.flush();
        return response(collection, null);
    }

    @Transactional
    public CollectionResponse update(
            UUID ownerId,
            UUID collectionId,
            long expectedVersion,
            String requestedName
    ) {
        CollectionEntity collection = requireOwned(ownerId, collectionId);
        if (collection.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Collection version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(collection.getVersion()))
            );
        }
        String name = normalizeDisplayName(requestedName);
        String normalized = normalizeName(name);
        if (collectionRepository.existsByOwnerIdAndNameNormalizedAndIdNot(
                ownerId,
                normalized,
                collectionId
        )) {
            throw nameTaken();
        }
        collection.rename(name, normalized);
        entityManager.flush();
        return response(collection, null);
    }

    @Transactional
    public void delete(UUID ownerId, UUID collectionId) {
        CollectionEntity collection = requireOwned(ownerId, collectionId);
        if (collection.isDefaultCollection()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.DEFAULT_COLLECTION_PROTECTED,
                    "The default collection cannot be deleted",
                    false,
                    Map.of()
            );
        }
        collectionRepository.delete(collection);
    }

    @Transactional
    public CollectionMembershipResponse addItem(
            UUID ownerId,
            UUID collectionId,
            UUID resourceId
    ) {
        requireOwned(ownerId, collectionId);
        knowledgeReadService.requireInteractive(resourceId);
        CollectionItemEntity item;
        if (itemRepository.existsByCollectionIdAndResourceId(collectionId, resourceId)) {
            item = itemRepository.findById(
                    new com.educhain.interaction.entity.CollectionItemKey(collectionId, resourceId)
            ).orElseThrow(this::notFound);
        } else {
            item = itemRepository.save(new CollectionItemEntity(collectionId, resourceId));
            activityService.record(ownerId, ActivityType.SAVED_RESOURCE, resourceId);
            entityManager.flush();
        }
        return new CollectionMembershipResponse(
                collectionId,
                resourceId,
                true,
                item.getCreatedAt()
        );
    }

    @Transactional
    public void removeItem(UUID ownerId, UUID collectionId, UUID resourceId) {
        requireOwned(ownerId, collectionId);
        itemRepository.deleteByCollectionIdAndResourceId(collectionId, resourceId);
    }

    @Transactional
    public CollectionItemListResponse items(
            UUID ownerId,
            UUID collectionId,
            String cursor,
            int limit
    ) {
        CollectionEntity collection = requireOwned(ownerId, collectionId);
        int pageIndex = decodeCursor(cursor);
        Page<CollectionItemEntity> page = itemRepository.findAllByCollectionId(
                collectionId,
                PageRequest.of(
                        pageIndex,
                        limit,
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("resourceId"))
                )
        );
        return new CollectionItemListResponse(
                response(collection, null),
                page.getContent().stream().map(item -> {
                    InteractiveResourceSnapshot resource = knowledgeReadService
                            .requireInteractive(item.getResourceId());
                    return new CollectionItemResponse(
                            collectionId,
                            resource.resource(),
                            item.getCreatedAt()
                    );
                }).toList(),
                new PageInfoResponse(
                        page.hasNext() ? encodeCursor(pageIndex + 1) : null,
                        page.hasNext()
                )
        );
    }

    private CollectionEntity ensureDefault(UUID ownerId) {
        return collectionRepository.findByOwnerIdAndDefaultCollectionTrue(ownerId)
                .orElseGet(() -> {
                    CollectionEntity collection = collectionRepository.save(new CollectionEntity(
                            UUID.randomUUID(),
                            ownerId,
                            "",
                            DEFAULT_NAME_NORMALIZED,
                            true
                    ));
                    entityManager.flush();
                    return collection;
                });
    }

    private CollectionEntity requireOwned(UUID ownerId, UUID collectionId) {
        return collectionRepository.findByIdAndOwnerId(collectionId, ownerId)
                .orElseThrow(this::notFound);
    }

    private CollectionResponse response(CollectionEntity collection, UUID resourceId) {
        return new CollectionResponse(
                collection.getId(),
                collection.getDisplayName(),
                collection.isDefaultCollection(),
                itemRepository.countByCollectionId(collection.getId()),
                resourceId != null && itemRepository.existsByCollectionIdAndResourceId(
                        collection.getId(), resourceId
                ),
                collection.getVersion(),
                collection.getCreatedAt(),
                collection.getUpdatedAt()
        );
    }

    private String normalizeDisplayName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeName(String value) {
        return value.toLowerCase(Locale.ROOT);
    }

    private String digest(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(cursor),
                    StandardCharsets.UTF_8
            );
            if (!decoded.startsWith("page:")) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(5));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("page:" + page).getBytes(StandardCharsets.UTF_8));
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Collection was not found",
                false,
                Map.of()
        );
    }

    private ApiException nameTaken() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.COLLECTION_NAME_TAKEN,
                "Collection name is already in use",
                false,
                Map.of()
        );
    }
}

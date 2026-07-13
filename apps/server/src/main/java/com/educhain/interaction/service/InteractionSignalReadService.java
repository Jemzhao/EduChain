package com.educhain.interaction.service;

import com.educhain.interaction.repository.CollectionItemRepository;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.interaction.repository.ResourceLikeRepository;
import com.educhain.interaction.repository.ResourceCountProjection;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionSignalReadService {

    private final ResourceLikeRepository likeRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final CommentRepository commentRepository;

    public InteractionSignalReadService(
            ResourceLikeRepository likeRepository,
            CollectionItemRepository collectionItemRepository,
            CommentRepository commentRepository
    ) {
        this.likeRepository = likeRepository;
        this.collectionItemRepository = collectionItemRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional(readOnly = true)
    public InteractionSignals signals(UUID resourceId) {
        return new InteractionSignals(
                likeRepository.countByResourceId(resourceId),
                collectionItemRepository.countByResourceId(resourceId),
                commentRepository.countByResourceId(resourceId)
        );
    }

    @Transactional(readOnly = true)
    public Map<UUID, InteractionSignals> signalsFor(Collection<UUID> resourceIds) {
        if (resourceIds.isEmpty()) return Map.of();
        Map<UUID, long[]> counts = new HashMap<>();
        merge(counts, likeRepository.countGroupedByResourceId(resourceIds), 0);
        merge(counts, collectionItemRepository.countGroupedByResourceId(resourceIds), 1);
        merge(counts, commentRepository.countGroupedByResourceId(resourceIds), 2);
        Map<UUID, InteractionSignals> result = new HashMap<>();
        counts.forEach((resourceId, values) -> result.put(
                resourceId,
                new InteractionSignals(values[0], values[1], values[2])
        ));
        return Map.copyOf(result);
    }

    private void merge(
            Map<UUID, long[]> counts,
            java.util.List<ResourceCountProjection> projections,
            int index
    ) {
        projections.forEach(projection -> counts
                .computeIfAbsent(projection.getResourceId(), ignored -> new long[3])[index]
                = projection.getTotal());
    }
}

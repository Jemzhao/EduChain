package com.educhain.knowledge.service;

import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeSearchReadService {

    private final KnowledgeVersionRepository versionRepository;
    private final KnowledgeResourceRepository resourceRepository;
    private final ResourceResponseFactory responseFactory;

    public KnowledgeSearchReadService(
            KnowledgeVersionRepository versionRepository,
            KnowledgeResourceRepository resourceRepository,
            ResourceResponseFactory responseFactory
    ) {
        this.versionRepository = versionRepository;
        this.resourceRepository = resourceRepository;
        this.responseFactory = responseFactory;
    }

    @Transactional(readOnly = true)
    public List<SearchableResourceSnapshot> candidates(int limit) {
        List<KnowledgeVersionEntity> versions = versionRepository.findCurrentPublished(
                PageRequest.of(
                        0,
                        limit,
                        Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("id"))
                )
        ).getContent();
        Map<UUID, KnowledgeResourceEntity> resources = new HashMap<>();
        resourceRepository.findAllById(versions.stream()
                        .map(KnowledgeVersionEntity::getResourceId)
                        .toList())
                .forEach(resource -> resources.put(resource.getId(), resource));
        List<ResourceCardSource> sources = versions.stream()
                .filter(version -> resources.containsKey(version.getResourceId()))
                .map(version -> new ResourceCardSource(
                        resources.get(version.getResourceId()),
                        version
                ))
                .toList();
        List<com.educhain.knowledge.dto.ResourceCardResponse> cards = responseFactory.cards(
                sources
        );
        return java.util.stream.IntStream.range(0, cards.size())
                .mapToObj(index -> new SearchableResourceSnapshot(
                        cards.get(index),
                        sources.get(index).version().getBodyContent()
                ))
                .toList();
    }
}

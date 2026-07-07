package com.educhain.knowledge.service;

import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.platform.port.KnowledgeStatisticsPort;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeProfileStatisticsService implements KnowledgeStatisticsPort {

    private final KnowledgeResourceRepository resourceRepository;

    public KnowledgeProfileStatisticsService(KnowledgeResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public long publishedCount(UUID authorId) {
        return resourceRepository.countByAuthorIdAndStatus(authorId, ResourceStatus.PUBLISHED);
    }
}

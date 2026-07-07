package com.educhain.knowledge.service;

import com.educhain.file.service.PublicFileAccessPolicy;
import com.educhain.knowledge.repository.KnowledgeVersionFileRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class KnowledgePublicFileAccessPolicy implements PublicFileAccessPolicy {

    private final KnowledgeVersionFileRepository versionFileRepository;
    private final KnowledgeVersionRepository versionRepository;

    public KnowledgePublicFileAccessPolicy(
            KnowledgeVersionFileRepository versionFileRepository,
            KnowledgeVersionRepository versionRepository
    ) {
        this.versionFileRepository = versionFileRepository;
        this.versionRepository = versionRepository;
    }

    @Override
    public boolean allows(UUID fileId) {
        return versionFileRepository.existsInPublishedResource(fileId)
                || versionRepository.existsPublishedCover(fileId);
    }
}

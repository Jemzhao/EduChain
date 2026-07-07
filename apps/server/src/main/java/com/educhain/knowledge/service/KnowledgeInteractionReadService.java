package com.educhain.knowledge.service;

import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeInteractionReadService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final ResourceResponseFactory responseFactory;

    public KnowledgeInteractionReadService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeVersionRepository versionRepository,
            ResourceResponseFactory responseFactory
    ) {
        this.resourceRepository = resourceRepository;
        this.versionRepository = versionRepository;
        this.responseFactory = responseFactory;
    }

    @Transactional(readOnly = true)
    public InteractiveResourceSnapshot requireInteractive(UUID resourceId) {
        KnowledgeResourceEntity resource = resourceRepository.findById(resourceId)
                .orElseThrow(this::notFound);
        if (resource.getStatus() != ResourceStatus.PUBLISHED
                || resource.getCurrentPublicVersionId() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.INTERACTION_TARGET_UNAVAILABLE,
                    "Resource is not available for interaction",
                    false,
                    Map.of("resourceId", resourceId.toString())
            );
        }
        KnowledgeVersionEntity version = versionRepository
                .findById(resource.getCurrentPublicVersionId())
                .orElseThrow(this::notFound);
        return new InteractiveResourceSnapshot(
                resource.getId(),
                resource.getAuthorId(),
                responseFactory.card(resource, version)
        );
    }

    @Transactional(readOnly = true)
    public Optional<KnowledgeReferenceSnapshot> findReference(UUID resourceId) {
        return resourceRepository.findById(resourceId).flatMap(resource -> {
            if (resource.getCurrentPublicVersionId() == null) return Optional.empty();
            return versionRepository.findById(resource.getCurrentPublicVersionId())
                    .map(version -> new KnowledgeReferenceSnapshot(
                            resource.getId(),
                            resource.getAuthorId(),
                            resource.getPublicSlug(),
                            version.getTitle(),
                            resource.getStatus()
                    ));
        });
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Resource was not found",
                false,
                Map.of()
        );
    }
}

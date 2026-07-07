package com.educhain.knowledge.service;

import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionFileRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.platform.contract.EvidenceAttachmentSnapshot;
import com.educhain.platform.contract.EvidenceVersionSnapshot;
import com.educhain.platform.port.KnowledgeEvidencePort;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeEvidenceReadService implements KnowledgeEvidencePort {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final KnowledgeVersionFileRepository versionFileRepository;

    public KnowledgeEvidenceReadService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeVersionRepository versionRepository,
            KnowledgeVersionFileRepository versionFileRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.versionRepository = versionRepository;
        this.versionFileRepository = versionFileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceVersionSnapshot requireVersion(UUID versionId) {
        KnowledgeVersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(this::notFound);
        var resource = resourceRepository.findById(version.getResourceId())
                .orElseThrow(this::notFound);
        var attachments = versionFileRepository
                .findAllByVersionIdOrderBySortOrderAsc(versionId)
                .stream()
                .map(file -> new EvidenceAttachmentSnapshot(
                        file.getSortOrder(),
                        file.getPurpose().name(),
                        file.getSha256AtPublication()
                ))
                .toList();
        return new EvidenceVersionSnapshot(
                resource.getId(),
                resource.getPublicSlug(),
                version.getId(),
                version.getVersionNumber(),
                version.getTitle(),
                resource.getAuthorId(),
                version.getContentSchemaVersion(),
                version.getContentDigest(),
                version.getPublishedAt(),
                attachments
        );
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceVersionSnapshot requireCurrentVersion(UUID resourceId) {
        var resource = resourceRepository.findById(resourceId).orElseThrow(this::notFound);
        if (resource.getCurrentPublicVersionId() == null) throw notFound();
        return requireVersion(resource.getCurrentPublicVersionId());
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Published resource version was not found",
                false,
                Map.of()
        );
    }
}

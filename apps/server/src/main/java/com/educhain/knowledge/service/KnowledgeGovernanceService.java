package com.educhain.knowledge.service;

import com.educhain.platform.port.EvidenceStatusPort;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.knowledge.repository.KnowledgeResourceRepository;
import com.educhain.knowledge.repository.KnowledgeVersionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeGovernanceService {

    private final KnowledgeResourceRepository resourceRepository;
    private final KnowledgeVersionRepository versionRepository;
    private final UserService userService;
    private final EvidenceStatusPort evidenceStatus;
    private final Clock clock;

    public KnowledgeGovernanceService(
            KnowledgeResourceRepository resourceRepository,
            KnowledgeVersionRepository versionRepository,
            UserService userService,
            EvidenceStatusPort evidenceStatus,
            Clock clock
    ) {
        this.resourceRepository = resourceRepository;
        this.versionRepository = versionRepository;
        this.userService = userService;
        this.evidenceStatus = evidenceStatus;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<GovernanceResourceView> list(ResourceStatus status, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        return (status == null
                ? resourceRepository.findAll(page)
                : resourceRepository.findAllByStatus(status, page)).map(this::view);
    }

    @Transactional
    public GovernanceResourceView withdraw(UUID resourceId) {
        KnowledgeResourceEntity resource = requireResource(resourceId);
        try {
            resource.withdraw(clock.instant());
        } catch (IllegalStateException exception) {
            throw conflict("Only a published resource can be withdrawn");
        }
        resourceRepository.flush();
        return view(resource);
    }

    @Transactional
    public GovernanceResourceView restore(UUID resourceId) {
        KnowledgeResourceEntity resource = requireResource(resourceId);
        try {
            resource.restore();
        } catch (IllegalStateException exception) {
            throw conflict("Only a withdrawn resource can be restored");
        }
        resourceRepository.flush();
        return view(resource);
    }

    @Transactional(readOnly = true)
    public long withdrawnCount() {
        return resourceRepository.countByStatus(ResourceStatus.WITHDRAWN);
    }

    private GovernanceResourceView view(KnowledgeResourceEntity resource) {
        KnowledgeVersionEntity version = resource.getCurrentPublicVersionId() == null
                ? null
                : versionRepository.findById(resource.getCurrentPublicVersionId()).orElse(null);
        PublicAuthorSnapshot author = userService.getPublicAuthor(resource.getAuthorId());
        return new GovernanceResourceView(
                resource.getId(),
                resource.getPublicSlug(),
                version == null ? "Untitled draft" : version.getTitle(),
                new ResourceAuthorResponse(
                        author.id(),
                        author.handle(),
                        author.displayName(),
                        author.avatarUrl()
                ),
                resource.getStatus(),
                resource.getVersion(),
                version == null
                        ? com.educhain.platform.contract.EvidenceProcessingStatus.NOT_REQUESTED
                        : evidenceStatus.status(version.getId()),
                resource.getPublishedAt()
        );
    }

    private KnowledgeResourceEntity requireResource(UUID resourceId) {
        return resourceRepository.findById(resourceId).orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Resource was not found",
                false,
                Map.of()
        ));
    }

    private ApiException conflict(String title) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.RESOURCE_ALREADY_WITHDRAWN,
                title,
                false,
                Map.of()
        );
    }
}

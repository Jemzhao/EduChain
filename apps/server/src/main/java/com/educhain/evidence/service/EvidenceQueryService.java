package com.educhain.evidence.service;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.dto.CreateVerificationRequest;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.evidence.dto.PublicEvidenceResponse;
import com.educhain.evidence.dto.ResourceEvidenceResponse;
import com.educhain.evidence.dto.VerificationResponse;
import com.educhain.evidence.entity.CertificateArtifactEntity;
import com.educhain.evidence.domain.CertificateStatus;
import com.educhain.evidence.entity.EvidenceJobEntity;
import com.educhain.evidence.domain.EvidenceJobStatus;
import com.educhain.evidence.entity.EvidenceRecordEntity;
import com.educhain.evidence.entity.VerificationEventEntity;
import com.educhain.evidence.domain.VerificationResult;
import com.educhain.evidence.gateway.EvidenceGatewayClient;
import com.educhain.evidence.gateway.EvidenceGatewayException;
import com.educhain.evidence.repository.CertificateArtifactRepository;
import com.educhain.evidence.repository.EvidenceJobRepository;
import com.educhain.evidence.repository.EvidenceRecordRepository;
import com.educhain.evidence.repository.VerificationEventRepository;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.platform.contract.EvidenceVersionSnapshot;
import com.educhain.platform.port.KnowledgeEvidencePort;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvidenceQueryService {

    private final EvidenceJobRepository jobRepository;
    private final EvidenceRecordRepository recordRepository;
    private final CertificateArtifactRepository certificateRepository;
    private final VerificationEventRepository verificationRepository;
    private final KnowledgeEvidencePort knowledgeReadService;
    private final UserService userService;
    private final EvidenceGatewayClient gatewayClient;
    private final EvidenceCryptography cryptography;
    private final EvidenceProperties properties;
    private final Clock clock;

    public EvidenceQueryService(
            EvidenceJobRepository jobRepository,
            EvidenceRecordRepository recordRepository,
            CertificateArtifactRepository certificateRepository,
            VerificationEventRepository verificationRepository,
            KnowledgeEvidencePort knowledgeReadService,
            UserService userService,
            EvidenceGatewayClient gatewayClient,
            EvidenceCryptography cryptography,
            EvidenceProperties properties,
            Clock clock
    ) {
        this.jobRepository = jobRepository;
        this.recordRepository = recordRepository;
        this.certificateRepository = certificateRepository;
        this.verificationRepository = verificationRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.userService = userService;
        this.gatewayClient = gatewayClient;
        this.cryptography = cryptography;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ResourceEvidenceResponse resourceEvidence(UUID resourceId) {
        EvidenceVersionSnapshot version = knowledgeReadService.requireCurrentVersion(resourceId);
        Optional<EvidenceJobEntity> job = jobRepository
                .findFirstByResourceIdOrderByCreatedAtDesc(resourceId);
        Optional<EvidenceRecordEntity> record = recordRepository.findByVersionId(
                version.versionId()
        );
        if (job.isEmpty()) {
            return new ResourceEvidenceResponse(
                    resourceId,
                    null,
                    EvidenceJobStatus.PENDING,
                    properties.backend(),
                    null,
                    true,
                    null
            );
        }
        EvidenceJobEntity current = job.orElseThrow();
        return new ResourceEvidenceResponse(
                resourceId,
                current.getId(),
                current.getStatus(),
                current.getBackend(),
                record.map(value -> publicResponse(value, version)).orElse(null),
                retryable(current),
                current.getLastErrorCode()
        );
    }

    @Transactional(readOnly = true)
    public PublicEvidenceResponse publicProof(UUID proofId) {
        EvidenceRecordEntity record = recordRepository.findById(proofId)
                .orElseThrow(this::evidenceNotFound);
        return publicResponse(record, knowledgeReadService.requireVersion(record.getVersionId()));
    }

    @Transactional(readOnly = true)
    public EvidenceJobResponse job(UUID actorId, UUID jobId) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow(this::jobNotFound);
        EvidenceVersionSnapshot version = knowledgeReadService.requireVersion(job.getVersionId());
        if (!version.authorId().equals(actorId)) throw jobNotFound();
        return new EvidenceJobResponse(
                job.getId(),
                job.getResourceId(),
                job.getVersionId(),
                job.getBackend(),
                job.getStatus(),
                job.getAttemptCount(),
                retryable(job),
                job.getLastErrorCode(),
                job.getNextAttemptAt(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    @Transactional
    public VerificationResponse verify(CreateVerificationRequest request, String callerSource) {
        if (request.proofId() != null && request.transactionId() != null) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FIELD_VALIDATION_FAILED,
                    "Choose either a proof ID or transaction ID",
                    false,
                    Map.of()
            );
        }
        Optional<EvidenceRecordEntity> record;
        if (request.proofId() != null) {
            record = recordRepository.findById(request.proofId());
        } else if (request.transactionId() != null) {
            record = recordRepository.findAllByTransactionId(request.transactionId().trim())
                    .stream()
                    .findFirst();
        } else {
            record = recordRepository.findFirstByContentDigestOrderByConfirmedAtDesc(
                    request.contentDigest()
            );
        }
        VerificationResult result;
        if (record.isEmpty()) {
            result = VerificationResult.NOT_FOUND;
        } else if (record.orElseThrow().getContentDigest().equals(request.contentDigest())) {
            result = VerificationResult.MATCHED;
        } else {
            result = VerificationResult.MISMATCHED;
        }
        UUID eventId = UUID.randomUUID();
        verificationRepository.save(new VerificationEventEntity(
                eventId,
                record.map(EvidenceRecordEntity::getId).orElse(null),
                request.method(),
                result,
                request.contentDigest(),
                cryptography.callerPseudonym(callerSource),
                clock.instant().plus(Duration.ofDays(30))
        ));
        PublicEvidenceResponse proof = record
                .map(value -> publicResponse(
                        value,
                        knowledgeReadService.requireVersion(value.getVersionId())
                ))
                .orElse(null);
        return new VerificationResponse(
                eventId,
                result,
                request.method(),
                request.contentDigest(),
                proof,
                clock.instant()
        );
    }

    public byte[] certificate(UUID proofId) {
        EvidenceRecordEntity record = recordRepository.findById(proofId)
                .orElseThrow(this::evidenceNotFound);
        CertificateArtifactEntity artifact = certificateRepository
                .findFirstByEvidenceRecordIdOrderByCreatedAtDesc(record.getId())
                .filter(value -> value.getStatus() == CertificateStatus.AVAILABLE)
                .orElseThrow(this::certificateNotReady);
        try {
            return gatewayClient.downloadCertificate(record.getId());
        } catch (EvidenceGatewayException exception) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    ErrorCode.EVIDENCE_BACKEND_UNAVAILABLE,
                    "Evidence certificate is temporarily unavailable",
                    true,
                    Map.of("proofId", proofId.toString())
            );
        }
    }

    private PublicEvidenceResponse publicResponse(
            EvidenceRecordEntity record,
            EvidenceVersionSnapshot version
    ) {
        PublicAuthorSnapshot author = userService.getPublicAuthor(version.authorId());
        CertificateArtifactEntity certificate = certificateRepository
                .findFirstByEvidenceRecordIdOrderByCreatedAtDesc(record.getId())
                .orElse(null);
        CertificateStatus certificateStatus = certificate == null
                ? CertificateStatus.PENDING
                : certificate.getStatus();
        return new PublicEvidenceResponse(
                record.getId(),
                record.getResourceId(),
                version.resourceSlug(),
                version.title(),
                record.getVersionId(),
                version.versionNumber(),
                new ResourceAuthorResponse(
                        author.id(),
                        author.handle(),
                        author.displayName(),
                        author.avatarUrl()
                ),
                record.getBackend(),
                record.getNetworkId(),
                record.getTransactionId(),
                record.getBlockHeight(),
                record.getBlockHash(),
                record.getContentDigest(),
                record.getAttachmentMerkleRoot(),
                record.getCanonicalizationVersion(),
                record.getPayloadVersion(),
                record.getSubmittedAt(),
                record.getConfirmedAt(),
                certificateStatus,
                certificateStatus == CertificateStatus.AVAILABLE
                        ? "/api/v1/evidence/" + record.getId() + "/certificate"
                        : null
        );
    }

    private boolean retryable(EvidenceJobEntity job) {
        return switch (job.getStatus()) {
            case COMPLETED, TERMINATED -> false;
            case CERTIFICATE_FAILED -> job.getNextAttemptAt() != null;
            default -> true;
        };
    }

    private ApiException evidenceNotFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.EVIDENCE_NOT_FOUND,
                "Evidence proof was not found",
                false,
                Map.of()
        );
    }

    private ApiException jobNotFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.EVIDENCE_JOB_NOT_FOUND,
                "Evidence job was not found",
                false,
                Map.of()
        );
    }

    private ApiException certificateNotReady() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.CERTIFICATE_NOT_READY,
                "Evidence certificate is not ready",
                true,
                Map.of()
        );
    }
}

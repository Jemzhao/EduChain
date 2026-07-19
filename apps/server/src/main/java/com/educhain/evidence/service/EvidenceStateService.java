package com.educhain.evidence.service;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.entity.CertificateArtifactEntity;
import com.educhain.evidence.entity.EvidenceJobEntity;
import com.educhain.evidence.domain.EvidenceJobStatus;
import com.educhain.evidence.entity.EvidenceRecordEntity;
import com.educhain.evidence.gateway.EvidenceGatewayException;
import com.educhain.evidence.gateway.GatewayCertificateArtifact;
import com.educhain.evidence.gateway.GatewayEvidencePayload;
import com.educhain.evidence.gateway.GatewayEvidenceProof;
import com.educhain.evidence.repository.CertificateArtifactRepository;
import com.educhain.evidence.repository.EvidenceJobRepository;
import com.educhain.evidence.repository.EvidenceRecordRepository;
import com.educhain.platform.contract.EvidenceVersionSnapshot;
import com.educhain.platform.port.KnowledgeEvidencePort;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
public class EvidenceStateService {

    public static final short PAYLOAD_VERSION = 1;
    public static final String CERTIFICATE_TEMPLATE_VERSION = "certificate-v1";

    private final EvidenceJobRepository jobRepository;
    private final EvidenceRecordRepository recordRepository;
    private final CertificateArtifactRepository certificateRepository;
    private final KnowledgeEvidencePort knowledgeReadService;
    private final EvidenceCryptography cryptography;
    private final EvidenceProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public EvidenceStateService(
            EvidenceJobRepository jobRepository,
            EvidenceRecordRepository recordRepository,
            CertificateArtifactRepository certificateRepository,
            KnowledgeEvidencePort knowledgeReadService,
            EvidenceCryptography cryptography,
            EvidenceProperties properties,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.jobRepository = jobRepository;
        this.recordRepository = recordRepository;
        this.certificateRepository = certificateRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.cryptography = cryptography;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public PreparedEvidenceSubmission prepare(UUID reliableJobId, UUID versionId) {
        EvidenceVersionSnapshot version = knowledgeReadService.requireVersion(versionId);
        EvidenceJobEntity job = jobRepository
                .findByVersionIdAndBackendAndPayloadVersion(
                        versionId,
                        properties.backend(),
                        PAYLOAD_VERSION
                )
                .orElseGet(() -> jobRepository.save(new EvidenceJobEntity(
                        version.resourceId(),
                        version.versionId(),
                        properties.backend(),
                        idempotencyKey(version.versionId()),
                        PAYLOAD_VERSION
                )));
        boolean lookupOnly = switch (job.getStatus()) {
            case ACCEPTED, UNKNOWN, CONFIRMING -> true;
            case CONFIRMED, CERTIFICATE_PENDING, CERTIFICATE_FAILED, COMPLETED -> true;
            default -> false;
        };
        if (lookupOnly) {
            job.beginConfirmation(clock.instant().plus(properties.leaseDuration()));
        } else {
            job.beginSubmission(clock.instant().plus(properties.leaseDuration()));
        }
        return new PreparedEvidenceSubmission(
                job.getId(),
                reliableJobId,
                job.getIdempotencyKey(),
                payload(version),
                version,
                lookupOnly
        );
    }

    @Transactional(readOnly = true)
    public boolean isCompleted(UUID versionId) {
        return jobRepository.findByVersionIdAndBackendAndPayloadVersion(
                        versionId,
                        properties.backend(),
                        PAYLOAD_VERSION
                )
                .map(job -> job.getStatus() == EvidenceJobStatus.COMPLETED)
                .orElse(false);
    }

    @Transactional
    public EvidenceProgress applyProof(UUID jobId, GatewayEvidenceProof proof) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow();
        return switch (proof.status()) {
            case "CONFIRMED" -> confirmed(job, proof);
            case "ACCEPTED" -> {
                job.accepted(clock.instant().plus(properties.pollDelay()));
                yield new EvidenceProgress(false, false, proof.proofId());
            }
            case "UNKNOWN" -> {
                job.unknown(
                        "EVIDENCE_RESULT_UNKNOWN",
                        clock.instant().plus(properties.pollDelay())
                );
                yield new EvidenceProgress(false, false, proof.proofId());
            }
            case "TERMINATED" -> {
                job.terminate("EVIDENCE_SUBMISSION_REJECTED");
                yield new EvidenceProgress(false, true, proof.proofId());
            }
            default -> {
                job.retry(
                        "EVIDENCE_GATEWAY_INVALID_RESPONSE",
                        clock.instant().plus(properties.retryDelay())
                );
                yield new EvidenceProgress(false, false, proof.proofId());
            }
        };
    }

    @Transactional
    public boolean applyFailure(UUID jobId, EvidenceGatewayException exception) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow();
        if (!exception.retryable() || job.getAttemptCount() >= properties.maxAttempts()) {
            job.terminate(exception.code());
            return true;
        }
        Instant next = clock.instant().plus(properties.retryDelay());
        if (exception.resultUnknown()) {
            job.unknown(exception.code(), next);
        } else {
            job.retry(exception.code(), next);
        }
        return false;
    }

    @Transactional
    public void certificatePending(UUID jobId) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow();
        EvidenceRecordEntity record = recordRepository.findByJobId(jobId).orElseThrow();
        certificateRepository
                .findByEvidenceRecordIdAndTemplateVersion(
                        record.getId(),
                        CERTIFICATE_TEMPLATE_VERSION
                )
                .orElseGet(() -> certificateRepository.save(new CertificateArtifactEntity(
                        record.getId(),
                        CERTIFICATE_TEMPLATE_VERSION
                )));
        job.certificatePending();
    }

    @Transactional
    public void completeCertificate(UUID jobId, GatewayCertificateArtifact artifact) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow();
        EvidenceRecordEntity record = recordRepository.findByJobId(jobId).orElseThrow();
        CertificateArtifactEntity certificate = certificateRepository
                .findByEvidenceRecordIdAndTemplateVersion(
                        record.getId(),
                        artifact.templateVersion()
                )
                .orElseThrow();
        certificate.available(
                artifact.objectKey(),
                artifact.sizeBytes(),
                artifact.sha256(),
                artifact.generatedAt()
        );
        job.completed();
    }

    @Transactional
    public boolean certificateFailure(UUID jobId, EvidenceGatewayException exception) {
        EvidenceJobEntity job = jobRepository.findById(jobId).orElseThrow();
        EvidenceRecordEntity record = recordRepository.findByJobId(jobId).orElseThrow();
        CertificateArtifactEntity certificate = certificateRepository
                .findByEvidenceRecordIdAndTemplateVersion(
                        record.getId(),
                        CERTIFICATE_TEMPLATE_VERSION
                )
                .orElseThrow();
        certificate.failed(exception.code());
        if (!exception.retryable() || job.getAttemptCount() >= properties.maxAttempts()) {
            job.certificateFailed(exception.code(), null);
            return true;
        }
        job.certificateFailed(
                exception.code(),
                clock.instant().plus(properties.retryDelay())
        );
        return false;
    }

    private EvidenceProgress confirmed(EvidenceJobEntity job, GatewayEvidenceProof proof) {
        validateProof(job, proof);
        recordRepository.findByJobId(job.getId()).orElseGet(() -> recordRepository.save(
                new EvidenceRecordEntity(
                        proof.proofId(),
                        job.getId(),
                        job.getResourceId(),
                        job.getVersionId(),
                        proof.payload().authorProofId(),
                        proof.payload().contentDigest(),
                        proof.payload().attachmentMerkleRoot(),
                        proof.payload().canonicalizationVersion(),
                        proof.payload().payloadVersion(),
                        proof.backend(),
                        proof.networkId(),
                        proof.transactionId(),
                        proof.blockHeight(),
                        proof.blockHash(),
                        proof.submittedAt(),
                        proof.confirmedAt(),
                        objectMapper.writeValueAsString(proof)
                )
        ));
        job.confirmed();
        return new EvidenceProgress(true, false, proof.proofId());
    }

    private void validateProof(EvidenceJobEntity job, GatewayEvidenceProof proof) {
        GatewayEvidencePayload expected = payload(
                knowledgeReadService.requireVersion(job.getVersionId())
        );
        if (!expected.equals(proof.payload())
                || proof.confirmedAt() == null
                || proof.backend() != job.getBackend()) {
            job.terminate("EVIDENCE_GATEWAY_INVALID_RESPONSE");
            throw new EvidenceGatewayException(
                    "EVIDENCE_GATEWAY_INVALID_RESPONSE",
                    "Evidence Gateway proof did not match the immutable version",
                    false,
                    false
            );
        }
    }

    private GatewayEvidencePayload payload(EvidenceVersionSnapshot version) {
        return new GatewayEvidencePayload(
                version.resourceId(),
                version.versionId(),
                cryptography.authorProofId(version.authorId()),
                version.canonicalizationVersion(),
                PAYLOAD_VERSION,
                version.contentDigest(),
                cryptography.attachmentMerkleRoot(version.attachments()),
                version.publishedAt()
        );
    }

    private String idempotencyKey(UUID versionId) {
        return "evidence-v1:" + properties.backend().name().toLowerCase() + ":" + versionId;
    }
}

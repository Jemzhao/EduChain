package com.educhain.evidence.service;

import com.educhain.evidence.config.EvidenceProperties;
import com.educhain.evidence.gateway.EvidenceGatewayClient;
import com.educhain.evidence.gateway.EvidenceGatewayException;
import com.educhain.evidence.gateway.GatewayCertificateRequest;
import com.educhain.evidence.gateway.GatewayEvidenceProof;
import com.educhain.job.service.ClaimedReliableJob;
import com.educhain.job.service.ReliableJobService;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import com.educhain.user.service.UserService;
import com.educhain.shared.api.BusinessMetrics;
import java.time.Clock;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EvidenceJobWorker {

    private static final String JOB_TYPE = "EVIDENCE_SUBMIT_VERSION";

    private final ReliableJobService reliableJobs;
    private final EvidenceStateService evidenceState;
    private final EvidenceGatewayClient gatewayClient;
    private final NotificationService notificationService;
    private final UserService userService;
    private final EvidenceProperties properties;
    private final Clock clock;
    private final BusinessMetrics metrics;

    public EvidenceJobWorker(
            ReliableJobService reliableJobs,
            EvidenceStateService evidenceState,
            EvidenceGatewayClient gatewayClient,
            NotificationService notificationService,
            UserService userService,
            EvidenceProperties properties,
            Clock clock,
            BusinessMetrics metrics
    ) {
        this.reliableJobs = reliableJobs;
        this.evidenceState = evidenceState;
        this.gatewayClient = gatewayClient;
        this.notificationService = notificationService;
        this.userService = userService;
        this.properties = properties;
        this.clock = clock;
        this.metrics = metrics;
    }

    @Scheduled(fixedDelayString = "${educhain.evidence.worker-delay:1s}")
    public void processNext() {
        reliableJobs.claim(JOB_TYPE, properties.leaseDuration()).ifPresent(this::process);
    }

    private void process(ClaimedReliableJob reliableJob) {
        UUID versionId;
        try {
            versionId = UUID.fromString(reliableJob.businessKey());
        } catch (IllegalArgumentException exception) {
            reliableJobs.terminate(reliableJob.id(), "EVIDENCE_BUSINESS_KEY_INVALID");
            return;
        }
        if (evidenceState.isCompleted(versionId)) {
            metrics.evidence("submission", "already_completed");
            reliableJobs.complete(reliableJob.id());
            return;
        }
        PreparedEvidenceSubmission prepared;
        try {
            prepared = evidenceState.prepare(
                    reliableJob.id(),
                    versionId
            );
        } catch (RuntimeException exception) {
            reliableJobs.reschedule(
                    reliableJob.id(),
                    clock.instant().plus(properties.retryDelay()),
                    "EVIDENCE_PREPARATION_FAILED"
            );
            return;
        }

        GatewayEvidenceProof proof;
        try {
            proof = prepared.lookupOnly()
                    ? gatewayClient.findSubmission(prepared.idempotencyKey())
                    : gatewayClient.submit(prepared.idempotencyKey(), prepared.payload());
        } catch (EvidenceGatewayException exception) {
            finishFailure(prepared, exception, false);
            return;
        }

        EvidenceProgress progress;
        try {
            progress = evidenceState.applyProof(prepared.jobId(), proof);
        } catch (EvidenceGatewayException exception) {
            finishFailure(prepared, exception, false);
            return;
        }
        if (progress.terminated()) {
            metrics.evidence("submission", "terminated");
            reliableJobs.terminate(reliableJob.id(), "EVIDENCE_SUBMISSION_TERMINATED");
            return;
        }
        if (!progress.confirmed()) {
            metrics.evidence("submission", "pending");
            reliableJobs.reschedule(
                    reliableJob.id(),
                    clock.instant().plus(properties.pollDelay()),
                    "EVIDENCE_CONFIRMATION_PENDING"
            );
            return;
        }

        evidenceState.certificatePending(prepared.jobId());
        try {
            var author = userService.getPublicAuthor(prepared.version().authorId());
            var artifact = gatewayClient.generateCertificate(
                    progress.proofId(),
                    new GatewayCertificateRequest(
                            prepared.version().title(),
                            prepared.version().versionNumber(),
                            author.displayName()
                    )
            );
            evidenceState.completeCertificate(prepared.jobId(), artifact);
            metrics.evidence("certificate", "succeeded");
            reliableJobs.complete(reliableJob.id());
            notificationService.emit(new NotificationIntent(
                    prepared.version().authorId(),
                    NotificationType.EVIDENCE_RESULT,
                    "evidence-completed:" + progress.proofId(),
                    null,
                    prepared.version().resourceId(),
                    null
            ));
        } catch (EvidenceGatewayException exception) {
            finishFailure(prepared, exception, true);
        }
    }

    private void finishFailure(
            PreparedEvidenceSubmission prepared,
            EvidenceGatewayException exception,
            boolean certificate
    ) {
        boolean terminal = certificate
                ? evidenceState.certificateFailure(prepared.jobId(), exception)
                : evidenceState.applyFailure(prepared.jobId(), exception);
        metrics.evidence(
                certificate ? "certificate" : "submission",
                terminal ? "terminated" : "retry_scheduled"
        );
        if (terminal) {
            reliableJobs.terminate(prepared.reliableJobId(), exception.code());
        } else {
            reliableJobs.reschedule(
                    prepared.reliableJobId(),
                    clock.instant().plus(properties.retryDelay()),
                    exception.code()
            );
        }
    }
}

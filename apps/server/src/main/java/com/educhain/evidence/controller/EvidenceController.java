package com.educhain.evidence.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.evidence.dto.CreateVerificationRequest;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.evidence.dto.PublicEvidenceResponse;
import com.educhain.evidence.dto.ResourceEvidenceResponse;
import com.educhain.evidence.dto.VerificationResponse;
import com.educhain.evidence.service.EvidenceQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class EvidenceController {

    private final EvidenceQueryService evidenceService;

    public EvidenceController(EvidenceQueryService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping("/resources/{resourceId}/evidence")
    public ResourceEvidenceResponse resourceEvidence(@PathVariable UUID resourceId) {
        return evidenceService.resourceEvidence(resourceId);
    }

    @GetMapping("/evidence/{proofId}")
    public PublicEvidenceResponse publicEvidence(@PathVariable UUID proofId) {
        return evidenceService.publicProof(proofId);
    }

    @GetMapping("/evidence/{proofId}/certificate")
    public ResponseEntity<byte[]> certificate(@PathVariable UUID proofId) {
        byte[] content = evidenceService.certificate(proofId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(content.length)
                .cacheControl(CacheControl.noCache())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("educhain-evidence-" + proofId + ".pdf")
                                .build()
                                .toString()
                )
                .body(content);
    }

    @PostMapping("/verifications")
    public VerificationResponse verify(
            @Valid @RequestBody CreateVerificationRequest request,
            HttpServletRequest servletRequest
    ) {
        return evidenceService.verify(request, servletRequest.getRemoteAddr());
    }

    @GetMapping("/evidence-jobs/{jobId}")
    public EvidenceJobResponse job(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID jobId
    ) {
        return evidenceService.job(principal.userId(), jobId);
    }
}

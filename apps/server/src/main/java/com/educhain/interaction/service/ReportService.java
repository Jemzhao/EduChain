package com.educhain.interaction.service;

import com.educhain.interaction.dto.CreateReportRequest;
import com.educhain.interaction.dto.ReportResponse;
import com.educhain.interaction.entity.ReportEntity;
import com.educhain.interaction.domain.ReportTargetType;
import com.educhain.interaction.domain.ReportStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.interaction.repository.ReportRepository;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.time.Clock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final CommentRepository commentRepository;
    private final KnowledgeInteractionReadService knowledge;
    private final Clock clock;

    public ReportService(
            ReportRepository reportRepository,
            CommentRepository commentRepository,
            KnowledgeInteractionReadService knowledge,
            Clock clock
    ) {
        this.reportRepository = reportRepository;
        this.commentRepository = commentRepository;
        this.knowledge = knowledge;
        this.clock = clock;
    }

    @Transactional
    public ReportResponse create(UUID reporterId, CreateReportRequest request) {
        validateTarget(request.targetType(), request.targetId());
        ReportEntity report = new ReportEntity(
                reporterId,
                request.targetType(),
                request.targetId(),
                request.reason(),
                request.details() == null ? "" : request.details().trim(),
                digest(reporterId + ":" + request.targetType() + ":" + request.targetId())
        );
        try {
            return toResponse(reportRepository.saveAndFlush(report));
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.REPORT_ALREADY_OPEN,
                    "An open report already exists for this target",
                    false,
                    Map.of()
            );
        }
    }

    public ReportResponse toResponse(ReportEntity report) {
        return new ReportResponse(
                report.getId(),
                report.getReporterId(),
                report.getTargetType(),
                report.getTargetId(),
                report.getReason(),
                report.getDetails(),
                report.getStatus(),
                report.getResolution(),
                report.getResolvedBy(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> list(ReportStatus status, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        return (status == null
                ? reportRepository.findAll(page)
                : reportRepository.findAllByStatusOrderByCreatedAtAsc(status, page))
                .map(this::toResponse);
    }

    @Transactional
    public ReportResponse resolve(
            UUID actorId,
            UUID reportId,
            ReportStatus status,
            String reason
    ) {
        ReportEntity report = reportRepository.findById(reportId).orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.REPORT_NOT_FOUND,
                "Report was not found",
                false,
                Map.of()
        ));
        try {
            report.resolve(status, reason, actorId, clock.instant());
        } catch (IllegalStateException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                    "Only an open report can be resolved",
                    false,
                    Map.of()
            );
        }
        reportRepository.flush();
        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public long openCount() {
        return reportRepository.countByStatus(ReportStatus.OPEN);
    }

    private void validateTarget(ReportTargetType type, UUID targetId) {
        boolean exists = type == ReportTargetType.COMMENT
                ? commentRepository.existsById(targetId)
                : knowledge.findReference(targetId).isPresent();
        if (!exists) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ErrorCode.RESOURCE_NOT_FOUND,
                    "The report target was not found",
                    false,
                    Map.of()
            );
        }
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 must be available", exception);
        }
    }
}

package com.educhain.file.service;

import com.educhain.file.dto.FileResponse;
import com.educhain.file.entity.FileObjectEntity;
import com.educhain.file.domain.FileStatus;
import com.educhain.file.entity.UploadSessionEntity;
import com.educhain.file.entity.UploadStatus;
import com.educhain.file.repository.FileObjectRepository;
import com.educhain.file.repository.UploadSessionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UploadStateService {

    private final UploadSessionRepository sessionRepository;
    private final FileObjectRepository fileRepository;
    private final Clock clock;

    public UploadStateService(
            UploadSessionRepository sessionRepository,
            FileObjectRepository fileRepository,
            Clock clock
    ) {
        this.sessionRepository = sessionRepository;
        this.fileRepository = fileRepository;
        this.clock = clock;
    }

    @Transactional
    public UploadTransferTarget prepareTransfer(UUID ownerId, UUID uploadId) {
        UploadSessionEntity session = requireSession(ownerId, uploadId);
        FileObjectEntity file = requireFile(session.getFileId());
        try {
            session.begin(clock.instant());
            file.beginUpload();
        } catch (IllegalStateException exception) {
            throw notReady();
        }
        return new UploadTransferTarget(file.getStorageKey(), file.getDeclaredSize());
    }

    @Transactional
    public void markReceived(UUID ownerId, UUID uploadId, long size) {
        UploadSessionEntity session = requireSession(ownerId, uploadId);
        FileObjectEntity file = requireFile(session.getFileId());
        try {
            session.received(clock.instant());
        } catch (IllegalStateException exception) {
            throw notReady();
        }
        file.markReceived(size);
    }

    @Transactional(readOnly = true)
    public FileObjectEntity requireForInspection(UUID ownerId, UUID uploadId) {
        UploadSessionEntity session = requireSession(ownerId, uploadId);
        if (session.getStatus() == UploadStatus.COMPLETED) {
            return requireFile(session.getFileId());
        }
        if (session.getStatus() != UploadStatus.RECEIVED) {
            throw notReady();
        }
        return requireFile(session.getFileId());
    }

    @Transactional
    public FileResponse makeAvailable(
            UUID ownerId,
            UUID uploadId,
            StoredObjectInspection inspection
    ) {
        UploadSessionEntity session = requireSession(ownerId, uploadId);
        FileObjectEntity file = requireFile(session.getFileId());
        file.makeAvailable(inspection.detectedMediaType(), inspection.sha256());
        session.complete(clock.instant());
        return toResponse(file);
    }

    @Transactional
    public void reject(
            UUID ownerId,
            UUID uploadId,
            String rejectionCode,
            String detectedMediaType
    ) {
        UploadSessionEntity session = requireSession(ownerId, uploadId);
        FileObjectEntity file = requireFile(session.getFileId());
        file.reject(rejectionCode, detectedMediaType);
        session.reject(clock.instant());
    }

    @Transactional(readOnly = true)
    public FileResponse getFile(UUID ownerId, UUID fileId) {
        FileObjectEntity file = requireFile(fileId);
        if (!file.getOwnerId().equals(ownerId)) {
            throw notFound();
        }
        return toResponse(file);
    }

    public FileResponse toResponse(FileObjectEntity file) {
        return new FileResponse(
                file.getId(),
                file.getPurpose(),
                file.getOriginalFileName(),
                file.getDeclaredSize(),
                file.getDeclaredMediaType(),
                file.getDetectedMediaType(),
                file.getSha256(),
                file.getStatus(),
                file.getRejectionCode()
        );
    }

    private UploadSessionEntity requireSession(UUID ownerId, UUID uploadId) {
        return sessionRepository.findByIdAndOwnerId(uploadId, ownerId).orElseThrow(this::notFound);
    }

    private FileObjectEntity requireFile(UUID fileId) {
        return fileRepository.findById(fileId).orElseThrow(this::notFound);
    }

    private ApiException notReady() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.UPLOAD_NOT_READY,
                "Upload is not ready for this operation",
                false,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Upload or file was not found",
                false,
                Map.of()
        );
    }
}

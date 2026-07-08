package com.educhain.file.service;

import com.educhain.file.config.FileStorageProperties;
import com.educhain.file.dto.CreateUploadRequest;
import com.educhain.file.dto.FileResponse;
import com.educhain.file.dto.UploadSessionResponse;
import com.educhain.file.entity.FileObjectEntity;
import com.educhain.file.domain.FileStatus;
import com.educhain.file.domain.UploadPurpose;
import com.educhain.file.entity.UploadSessionEntity;
import com.educhain.file.repository.FileObjectRepository;
import com.educhain.file.repository.UploadSessionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FileUploadService {

    private final FileObjectRepository fileRepository;
    private final UploadSessionRepository sessionRepository;
    private final UploadStateService stateService;
    private final LocalObjectStorage storage;
    private final MediaTypePolicy mediaTypePolicy;
    private final FileStorageProperties properties;
    private final IdempotencyService idempotencyService;
    private final Clock clock;
    private final List<PublicFileAccessPolicy> publicAccessPolicies;

    public FileUploadService(
            FileObjectRepository fileRepository,
            UploadSessionRepository sessionRepository,
            UploadStateService stateService,
            LocalObjectStorage storage,
            MediaTypePolicy mediaTypePolicy,
            FileStorageProperties properties,
            IdempotencyService idempotencyService,
            Clock clock,
            List<PublicFileAccessPolicy> publicAccessPolicies
    ) {
        this.fileRepository = fileRepository;
        this.sessionRepository = sessionRepository;
        this.stateService = stateService;
        this.storage = storage;
        this.mediaTypePolicy = mediaTypePolicy;
        this.properties = properties;
        this.idempotencyService = idempotencyService;
        this.clock = clock;
        this.publicAccessPolicies = List.copyOf(publicAccessPolicies);
    }

    @Transactional
    public UploadSessionResponse create(
            UUID ownerId,
            String idempotencyKey,
            CreateUploadRequest request
    ) {
        validateCreateRequest(request);
        String scope = "UPLOAD_CREATE:" + ownerId;
        Optional<String> replay = idempotencyService.begin(
                scope,
                idempotencyKey,
                digest(request)
        );
        if (replay.isPresent()) {
            return response(sessionRepository.findById(UUID.fromString(replay.orElseThrow()))
                    .orElseThrow(this::notFound));
        }

        UUID fileId = UUID.randomUUID();
        UUID uploadId = UUID.randomUUID();
        Instant expiresAt = clock.instant().plus(properties.uploadTtl());
        String fileName = safeFileName(request.fileName());
        fileRepository.save(new FileObjectEntity(
                fileId,
                ownerId,
                request.purpose(),
                "quarantine/" + fileId,
                fileName,
                request.size(),
                mediaTypePolicy.normalize(request.mediaType()),
                expiresAt
        ));
        UploadSessionEntity session = sessionRepository.save(
                new UploadSessionEntity(uploadId, fileId, ownerId, expiresAt)
        );
        idempotencyService.complete(
                scope,
                idempotencyKey,
                ownerId,
                uploadId.toString(),
                HttpStatus.CREATED.value()
        );
        return response(session);
    }

    public void putContent(UUID ownerId, UUID uploadId, InputStream input) {
        UploadTransferTarget target = stateService.prepareTransfer(ownerId, uploadId);
        try {
            long received = storage.write(target.storageKey(), input, properties.maxUploadBytes());
            stateService.markReceived(ownerId, uploadId, received);
        } catch (LocalObjectStorage.UploadLimitExceededException exception) {
            throw tooLarge();
        } catch (LocalObjectStorage.ObjectStorageException exception) {
            throw unavailable();
        }
    }

    public FileResponse complete(UUID ownerId, UUID uploadId) {
        FileObjectEntity file = stateService.requireForInspection(ownerId, uploadId);
        if (file.getStatus() == com.educhain.file.domain.FileStatus.AVAILABLE) {
            return stateService.toResponse(file);
        }

        StoredObjectInspection inspection;
        try {
            inspection = storage.inspect(file.getStorageKey(), file.getDeclaredMediaType());
        } catch (LocalObjectStorage.ObjectStorageException exception) {
            throw unavailable();
        }

        if (inspection.size() != file.getDeclaredSize()) {
            stateService.reject(
                    ownerId,
                    uploadId,
                    "UPLOAD_SIZE_MISMATCH",
                    inspection.detectedMediaType()
            );
            throw rejected("Uploaded size does not match the declared size");
        }
        if (!mediaTypePolicy.accepts(file.getPurpose(), inspection.detectedMediaType())
                || !mediaTypePolicy.signaturesAgree(
                        file.getDeclaredMediaType(),
                        inspection.detectedMediaType()
                )) {
            stateService.reject(
                    ownerId,
                    uploadId,
                    ErrorCode.UPLOAD_MEDIA_TYPE_UNSUPPORTED.name(),
                    inspection.detectedMediaType()
            );
            throw unsupportedMediaType();
        }
        return stateService.makeAvailable(ownerId, uploadId, inspection);
    }

    public FileResponse getFile(UUID ownerId, UUID fileId) {
        return stateService.getFile(ownerId, fileId);
    }

    @Transactional(readOnly = true)
    public FileContent readContent(UUID requesterId, UUID fileId) {
        FileObjectEntity file = fileRepository.findById(fileId).orElseThrow(this::notFound);
        boolean publiclyReadable = file.getPurpose() == UploadPurpose.AVATAR
                || publicAccessPolicies.stream().anyMatch(policy -> policy.allows(fileId));
        if (!publiclyReadable && (requesterId == null || !requesterId.equals(file.getOwnerId()))) {
            throw notFound();
        }
        if (file.getStatus() != FileStatus.AVAILABLE) {
            throw notFound();
        }
        try {
            return new FileContent(
                    storage.open(file.getStorageKey()),
                    file.getDetectedMediaType(),
                    file.getOriginalFileName(),
                    file.getDeclaredSize(),
                    file.getSha256()
            );
        } catch (LocalObjectStorage.ObjectStorageException exception) {
            throw unavailable();
        }
    }

    private void validateCreateRequest(CreateUploadRequest request) {
        if (request.size() > properties.maxUploadBytes()) {
            throw tooLarge();
        }
        if (!mediaTypePolicy.accepts(request.purpose(), request.mediaType())) {
            throw unsupportedMediaType();
        }
    }

    private UploadSessionResponse response(UploadSessionEntity session) {
        return new UploadSessionResponse(
                session.getId(),
                session.getFileId(),
                "/api/v1/uploads/" + session.getId() + "/content",
                "PUT",
                session.getExpiresAt(),
                properties.maxUploadBytes()
        );
    }

    private String safeFileName(String rawName) {
        String normalized = rawName.replace('\\', '/').trim();
        String name = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (name.isBlank() || name.equals(".") || name.equals("..") || name.chars().anyMatch(Character::isISOControl)) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FIELD_VALIDATION_FAILED,
                    "File name is invalid",
                    false,
                    Map.of()
            );
        }
        return name;
    }

    private String digest(CreateUploadRequest request) {
        String canonical = String.join(
                "\n",
                request.purpose().name(),
                safeFileName(request.fileName()),
                Long.toString(request.size()),
                mediaTypePolicy.normalize(request.mediaType())
        );
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ApiException tooLarge() {
        return new ApiException(
                HttpStatus.CONTENT_TOO_LARGE,
                ErrorCode.UPLOAD_TOO_LARGE,
                "Upload exceeds the allowed size",
                false,
                Map.of("maxBytes", Long.toString(properties.maxUploadBytes()))
        );
    }

    private ApiException unsupportedMediaType() {
        return new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                ErrorCode.UPLOAD_MEDIA_TYPE_UNSUPPORTED,
                "Upload media type is unsupported",
                false,
                Map.of()
        );
    }

    private ApiException rejected(String title) {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.UPLOAD_REJECTED,
                title,
                false,
                Map.of()
        );
    }

    private ApiException unavailable() {
        return new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.SERVICE_UNAVAILABLE,
                "Object storage is temporarily unavailable",
                true,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Upload session was not found",
                false,
                Map.of()
        );
    }
}

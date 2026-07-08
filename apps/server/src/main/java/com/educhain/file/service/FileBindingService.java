package com.educhain.file.service;

import com.educhain.file.entity.FileObjectEntity;
import com.educhain.file.domain.FileStatus;
import com.educhain.file.domain.UploadPurpose;
import com.educhain.file.repository.FileObjectRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FileBindingService {

    private final FileObjectRepository repository;

    public FileBindingService(FileObjectRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public FileSnapshot requireAvailable(
            UUID ownerId,
            UUID fileId,
            Set<UploadPurpose> allowedPurposes
    ) {
        return requireAvailable(ownerId, List.of(fileId), allowedPurposes).getFirst();
    }

    @Transactional(readOnly = true)
    public List<FileSnapshot> requireAvailable(
            UUID ownerId,
            Collection<UUID> fileIds,
            Set<UploadPurpose> allowedPurposes
    ) {
        LinkedHashSet<UUID> uniqueIds = new LinkedHashSet<>(fileIds);
        if (uniqueIds.isEmpty()) {
            return List.of();
        }
        List<FileObjectEntity> files = repository.findAllByIdInAndOwnerId(uniqueIds, ownerId);
        if (files.size() != uniqueIds.size()) {
            throw notFound();
        }
        Map<UUID, FileObjectEntity> byId = new HashMap<>();
        files.forEach(file -> byId.put(file.getId(), file));
        return uniqueIds.stream()
                .map(byId::get)
                .map(file -> toSnapshot(requireBindable(file, allowedPurposes)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FileSnapshot> readPublishedMetadata(Collection<UUID> fileIds) {
        LinkedHashSet<UUID> uniqueIds = new LinkedHashSet<>(fileIds);
        if (uniqueIds.isEmpty()) {
            return List.of();
        }
        List<FileObjectEntity> files = repository.findAllById(uniqueIds);
        if (files.size() != uniqueIds.size()) {
            throw notFound();
        }
        Map<UUID, FileObjectEntity> byId = new HashMap<>();
        files.forEach(file -> byId.put(file.getId(), file));
        return uniqueIds.stream()
                .map(byId::get)
                .map(file -> toSnapshot(requireBindable(
                        file,
                        Set.of(UploadPurpose.RESOURCE_ATTACHMENT)
                )))
                .toList();
    }

    private FileObjectEntity requireBindable(
            FileObjectEntity file,
            Set<UploadPurpose> allowedPurposes
    ) {
        if (file.getStatus() == FileStatus.REJECTED) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.UPLOAD_REJECTED,
                    "File did not pass inspection",
                    false,
                    Map.of("fileId", file.getId().toString())
            );
        }
        if (file.getStatus() != FileStatus.AVAILABLE) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.UPLOAD_NOT_READY,
                    "File is not available",
                    false,
                    Map.of("fileId", file.getId().toString())
            );
        }
        if (!allowedPurposes.contains(file.getPurpose())) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.UPLOAD_REJECTED,
                    "File purpose does not match the requested binding",
                    false,
                    Map.of("fileId", file.getId().toString())
            );
        }
        return file;
    }

    private FileSnapshot toSnapshot(FileObjectEntity file) {
        return new FileSnapshot(
                file.getId(),
                file.getOwnerId(),
                file.getPurpose(),
                file.getOriginalFileName(),
                file.getDeclaredSize(),
                file.getDetectedMediaType(),
                file.getSha256()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "One or more files were not found",
                false,
                Map.of()
        );
    }
}

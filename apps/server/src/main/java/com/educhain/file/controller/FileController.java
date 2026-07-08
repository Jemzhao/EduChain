package com.educhain.file.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.file.dto.CreateUploadRequest;
import com.educhain.file.dto.FileResponse;
import com.educhain.file.dto.UploadSessionResponse;
import com.educhain.file.service.FileUploadService;
import com.educhain.file.service.FileContent;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.InputStreamResource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class FileController {

    private final FileUploadService fileUploadService;

    public FileController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/uploads")
    public ResponseEntity<UploadSessionResponse> createUpload(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey,
            @Valid @RequestBody CreateUploadRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileUploadService.create(principal.userId(), idempotencyKey, request));
    }

    @PutMapping(path = "/uploads/{uploadId}/content", consumes = "application/octet-stream")
    public ResponseEntity<Void> putContent(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID uploadId,
            HttpServletRequest request
    ) throws IOException {
        fileUploadService.putContent(principal.userId(), uploadId, request.getInputStream());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/uploads/{uploadId}/completion")
    public FileResponse completeUpload(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID uploadId
    ) {
        return fileUploadService.complete(principal.userId(), uploadId);
    }

    @GetMapping("/files/{fileId}")
    public FileResponse file(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID fileId
    ) {
        return fileUploadService.getFile(principal.userId(), fileId);
    }

    @GetMapping("/files/{fileId}/content")
    public ResponseEntity<InputStreamResource> content(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID fileId
    ) {
        FileContent content = fileUploadService.readContent(
                principal == null ? null : principal.userId(),
                fileId
        );
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.mediaType()))
                .contentLength(content.size())
                .cacheControl(CacheControl.noCache())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(content.fileName()).build().toString()
                )
                .eTag('"' + content.sha256() + '"')
                .body(new InputStreamResource(content.inputStream()));
    }
}

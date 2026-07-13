package com.educhain.interaction.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.interaction.dto.CollectionItemListResponse;
import com.educhain.interaction.dto.CollectionListResponse;
import com.educhain.interaction.dto.CollectionMembershipResponse;
import com.educhain.interaction.dto.CollectionResponse;
import com.educhain.interaction.dto.CommentResponse;
import com.educhain.interaction.dto.CommentThreadListResponse;
import com.educhain.interaction.dto.CreateCollectionRequest;
import com.educhain.interaction.dto.CreateCommentRequest;
import com.educhain.interaction.dto.LikeStateRequest;
import com.educhain.interaction.dto.LikeStateResponse;
import com.educhain.interaction.dto.CreateReportRequest;
import com.educhain.interaction.dto.ReportResponse;
import com.educhain.interaction.dto.UpdateCollectionRequest;
import com.educhain.interaction.service.CollectionService;
import com.educhain.interaction.service.CommentService;
import com.educhain.interaction.service.LikeService;
import com.educhain.interaction.service.ReportService;
import com.educhain.shared.http.EntityTagVersions;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class InteractionController {

    private final LikeService likeService;
    private final CollectionService collectionService;
    private final CommentService commentService;
    private final ReportService reportService;

    public InteractionController(
            LikeService likeService,
            CollectionService collectionService,
            CommentService commentService,
            ReportService reportService
    ) {
        this.likeService = likeService;
        this.collectionService = collectionService;
        this.commentService = commentService;
        this.reportService = reportService;
    }

    @GetMapping("/resources/{resourceId}/like")
    public LikeStateResponse likeState(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId
    ) {
        return likeService.state(principal.userId(), resourceId);
    }

    @PutMapping("/resources/{resourceId}/like")
    public LikeStateResponse setLikeState(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @Valid @RequestBody LikeStateRequest request
    ) {
        return likeService.setState(principal.userId(), resourceId, request.liked());
    }

    @GetMapping("/resources/{resourceId}/comments")
    public CommentThreadListResponse comments(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return commentService.list(
                resourceId,
                principal == null ? null : principal.userId(),
                cursor,
                limit
        );
    }

    @PostMapping("/resources/{resourceId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID resourceId,
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(
                principal.userId(),
                resourceId,
                idempotencyKey,
                request
        ));
    }

    @DeleteMapping("/comments/{commentId}")
    public CommentResponse deleteComment(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID commentId
    ) {
        return commentService.deleteOwn(principal.userId(), commentId);
    }

    @PostMapping("/reports")
    public ResponseEntity<ReportResponse> createReport(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody CreateReportRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.create(principal.userId(), request));
    }

    @GetMapping("/collections")
    public CollectionListResponse collections(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(required = false) UUID resourceId
    ) {
        return collectionService.list(principal.userId(), resourceId);
    }

    @PostMapping("/collections")
    public ResponseEntity<CollectionResponse> createCollection(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey,
            @Valid @RequestBody CreateCollectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.create(
                principal.userId(),
                idempotencyKey,
                request.name()
        ));
    }

    @PatchMapping("/collections/{collectionId}")
    public ResponseEntity<CollectionResponse> updateCollection(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID collectionId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody UpdateCollectionRequest request
    ) {
        CollectionResponse response = collectionService.update(
                principal.userId(),
                collectionId,
                EntityTagVersions.parse(ifMatch),
                request.name()
        );
        return ResponseEntity.ok().eTag(Long.toString(response.version())).body(response);
    }

    @DeleteMapping("/collections/{collectionId}")
    public ResponseEntity<Void> deleteCollection(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID collectionId
    ) {
        collectionService.delete(principal.userId(), collectionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/collections/{collectionId}/items")
    public CollectionItemListResponse collectionItems(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID collectionId,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return collectionService.items(principal.userId(), collectionId, cursor, limit);
    }

    @PutMapping("/collections/{collectionId}/items/{resourceId}")
    public CollectionMembershipResponse addCollectionItem(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID collectionId,
            @PathVariable UUID resourceId
    ) {
        return collectionService.addItem(principal.userId(), collectionId, resourceId);
    }

    @DeleteMapping("/collections/{collectionId}/items/{resourceId}")
    public ResponseEntity<Void> deleteCollectionItem(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID collectionId,
            @PathVariable UUID resourceId
    ) {
        collectionService.removeItem(principal.userId(), collectionId, resourceId);
        return ResponseEntity.noContent().build();
    }
}

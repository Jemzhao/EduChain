package com.educhain.interaction.service;

import com.educhain.activity.domain.ActivityType;
import com.educhain.activity.service.ActivityService;
import com.educhain.interaction.dto.CommentResponse;
import com.educhain.interaction.dto.CommentThreadListResponse;
import com.educhain.interaction.dto.CommentThreadResponse;
import com.educhain.interaction.dto.CreateCommentRequest;
import com.educhain.interaction.entity.CommentEntity;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.knowledge.service.InteractiveResourceSnapshot;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final KnowledgeInteractionReadService knowledgeReadService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final IdempotencyService idempotencyService;
    private final EntityManager entityManager;
    private final Clock clock;
    private final ActivityService activityService;

    public CommentService(
            CommentRepository commentRepository,
            KnowledgeInteractionReadService knowledgeReadService,
            UserService userService,
            NotificationService notificationService,
            IdempotencyService idempotencyService,
            EntityManager entityManager,
            Clock clock,
            ActivityService activityService
    ) {
        this.commentRepository = commentRepository;
        this.knowledgeReadService = knowledgeReadService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.idempotencyService = idempotencyService;
        this.entityManager = entityManager;
        this.clock = clock;
        this.activityService = activityService;
    }

    @Transactional(readOnly = true)
    public CommentThreadListResponse list(
            UUID resourceId,
            UUID viewerId,
            String cursor,
            int limit
    ) {
        InteractiveResourceSnapshot resource = knowledgeReadService.requireInteractive(resourceId);
        int pageIndex = decodeCursor(cursor);
        Page<CommentEntity> roots = commentRepository
                .findAllByResourceIdAndParentCommentIdIsNull(
                        resourceId,
                        PageRequest.of(
                                pageIndex,
                                limit,
                                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
                        )
                );
        List<CommentThreadResponse> items = roots.getContent().stream().map(root -> {
            List<CommentEntity> replies = commentRepository
                    .findAllByRootCommentIdAndParentCommentIdIsNotNullOrderByCreatedAtAscIdAsc(
                            root.getId()
                    );
            return new CommentThreadResponse(
                    toResponse(root, viewerId, replies.size()),
                    replies.stream().map(reply -> toResponse(reply, viewerId, 0)).toList()
            );
        }).toList();
        return new CommentThreadListResponse(
                items,
                commentRepository.countByResourceIdAndParentCommentIdIsNull(resourceId),
                new PageInfoResponse(
                        roots.hasNext() ? encodeCursor(pageIndex + 1) : null,
                        roots.hasNext()
                )
        );
    }

    @Transactional
    public CommentResponse create(
            UUID authorId,
            UUID resourceId,
            String idempotencyKey,
            CreateCommentRequest request
    ) {
        InteractiveResourceSnapshot resource = knowledgeReadService.requireInteractive(resourceId);
        userService.requireActiveSocialUser(authorId);
        String body = normalizeBody(request.body());
        String scope = "COMMENT_CREATE:" + authorId;
        String requestDigest = digest(resourceId + "\n" + request.parentCommentId() + "\n" + body);
        Optional<String> replay = idempotencyService.begin(scope, idempotencyKey, requestDigest);
        if (replay.isPresent()) {
            CommentEntity existing = commentRepository.findById(
                    UUID.fromString(replay.orElseThrow())
            ).orElseThrow(this::notFound);
            return toResponse(existing, authorId, replyCount(existing));
        }

        CommentEntity parent = requireParent(resourceId, request.parentCommentId());
        UUID commentId = UUID.randomUUID();
        CommentEntity comment = commentRepository.save(new CommentEntity(
                commentId,
                resourceId,
                authorId,
                parent == null ? null : parent.getId(),
                parent == null ? commentId : parent.getRootCommentId(),
                body
        ));
        activityService.record(authorId, ActivityType.COMMENTED_RESOURCE, resourceId);
        idempotencyService.complete(
                scope,
                idempotencyKey,
                authorId,
                commentId.toString(),
                HttpStatus.CREATED.value()
        );
        if (parent != null) {
            notificationService.emit(new NotificationIntent(
                    parent.getAuthorId(),
                    NotificationType.COMMENT_REPLY,
                    "comment-reply:" + commentId,
                    authorId,
                    resourceId,
                    commentId
            ));
        }
        if (parent == null || !parent.getAuthorId().equals(resource.authorId())) {
            notificationService.emit(new NotificationIntent(
                    resource.authorId(),
                    NotificationType.RESOURCE_COMMENT,
                    "resource-comment:" + commentId,
                    authorId,
                    resourceId,
                    commentId
            ));
        }
        entityManager.flush();
        return toResponse(comment, authorId, 0);
    }

    @Transactional
    public CommentResponse deleteOwn(UUID authorId, UUID commentId) {
        CommentEntity comment = commentRepository.findByIdAndAuthorId(commentId, authorId)
                .orElseThrow(this::notFound);
        comment.softDelete(clock.instant());
        entityManager.flush();
        return toResponse(comment, authorId, replyCount(comment));
    }

    @Transactional(readOnly = true)
    public long count(UUID resourceId) {
        return commentRepository.countByResourceId(resourceId);
    }

    private CommentEntity requireParent(UUID resourceId, UUID parentCommentId) {
        if (parentCommentId == null) return null;
        CommentEntity parent = commentRepository.findById(parentCommentId)
                .orElseThrow(this::invalidParent);
        if (!parent.getResourceId().equals(resourceId)
                || parent.getParentCommentId() != null
                || parent.getStatus() != CommentStatus.VISIBLE) {
            throw invalidParent();
        }
        return parent;
    }

    private CommentResponse toResponse(CommentEntity comment, UUID viewerId, int replyCount) {
        PublicAuthorSnapshot author = userService.getPublicAuthor(comment.getAuthorId());
        return new CommentResponse(
                comment.getId(),
                comment.getResourceId(),
                comment.getParentCommentId(),
                comment.getRootCommentId(),
                new ResourceAuthorResponse(
                        author.id(),
                        author.handle(),
                        author.displayName(),
                        author.avatarUrl()
                ),
                comment.getStatus() == CommentStatus.VISIBLE ? comment.getBodyContent() : null,
                comment.getStatus(),
                replyCount,
                viewerId != null
                        && viewerId.equals(comment.getAuthorId())
                        && comment.getStatus() == CommentStatus.VISIBLE,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    private int replyCount(CommentEntity comment) {
        if (comment.getParentCommentId() != null) return 0;
        return Math.toIntExact(commentRepository
                .countByRootCommentIdAndParentCommentIdIsNotNull(comment.getId()));
    }

    private String normalizeBody(String value) {
        return value.replace("\r\n", "\n").replace('\r', '\n').strip();
    }

    private String digest(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(cursor),
                    StandardCharsets.UTF_8
            );
            if (!decoded.startsWith("page:")) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(5));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("page:" + page).getBytes(StandardCharsets.UTF_8));
    }

    private ApiException invalidParent() {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.COMMENT_PARENT_INVALID,
                "Comment parent is invalid",
                false,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Comment was not found",
                false,
                Map.of()
        );
    }
}

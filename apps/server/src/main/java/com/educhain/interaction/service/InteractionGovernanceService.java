package com.educhain.interaction.service;

import com.educhain.interaction.entity.CommentEntity;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.repository.CommentRepository;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.service.KnowledgeInteractionReadService;
import com.educhain.knowledge.service.KnowledgeReferenceSnapshot;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionGovernanceService {

    private final CommentRepository commentRepository;
    private final KnowledgeInteractionReadService knowledge;
    private final UserService userService;

    public InteractionGovernanceService(
            CommentRepository commentRepository,
            KnowledgeInteractionReadService knowledge,
            UserService userService
    ) {
        this.commentRepository = commentRepository;
        this.knowledge = knowledge;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public Page<GovernanceCommentView> list(CommentStatus status, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        return (status == null
                ? commentRepository.findAll(page)
                : commentRepository.findAllByStatusOrderByCreatedAtDesc(status, page)).map(this::view);
    }

    @Transactional
    public GovernanceCommentView hide(UUID commentId) {
        CommentEntity comment = requireComment(commentId);
        try {
            comment.hide();
        } catch (IllegalStateException exception) {
            throw conflict("Only a visible comment can be hidden");
        }
        commentRepository.flush();
        return view(comment);
    }

    @Transactional
    public GovernanceCommentView restore(UUID commentId) {
        CommentEntity comment = requireComment(commentId);
        try {
            comment.restore();
        } catch (IllegalStateException exception) {
            throw conflict("Only a governance-hidden comment can be restored");
        }
        commentRepository.flush();
        return view(comment);
    }

    @Transactional(readOnly = true)
    public long hiddenCount() {
        return commentRepository.countByStatus(CommentStatus.HIDDEN);
    }

    private GovernanceCommentView view(CommentEntity comment) {
        KnowledgeReferenceSnapshot resource = knowledge.findReference(comment.getResourceId())
                .orElseThrow(this::notFound);
        PublicAuthorSnapshot author = userService.getPublicAuthor(comment.getAuthorId());
        return new GovernanceCommentView(
                comment.getId(),
                comment.getResourceId(),
                resource.title(),
                new ResourceAuthorResponse(
                        author.id(),
                        author.handle(),
                        author.displayName(),
                        author.avatarUrl()
                ),
                comment.getBodyContent(),
                comment.getStatus(),
                comment.getVersion(),
                comment.getCreatedAt()
        );
    }

    private CommentEntity requireComment(UUID commentId) {
        return commentRepository.findById(commentId).orElseThrow(this::notFound);
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

    private ApiException conflict(String title) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ADMIN_ACTION_NOT_ALLOWED,
                title,
                false,
                Map.of()
        );
    }
}

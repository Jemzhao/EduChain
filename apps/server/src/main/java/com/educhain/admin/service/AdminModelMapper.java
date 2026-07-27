package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.entity.AuditEventEntity;
import com.educhain.auth.dto.PasswordResetRequestResponse;
import com.educhain.interaction.service.GovernanceCommentView;
import com.educhain.knowledge.service.GovernanceResourceView;
import com.educhain.taxonomy.service.GovernanceTaxonomyView;
import com.educhain.user.service.GovernanceUserView;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
public class AdminModelMapper {

    AdminModels.UserResponse user(GovernanceUserView view) {
        return new AdminModels.UserResponse(view.user(), view.email(), view.roles(), view.createdAt());
    }

    AdminModels.PasswordResetResponse passwordReset(
            PasswordResetRequestResponse response
    ) {
        return new AdminModels.PasswordResetResponse(
                response.accepted(),
                response.previewToken()
        );
    }

    String csv(String value) {
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    AdminModels.ResourceResponse resource(GovernanceResourceView view) {
        return new AdminModels.ResourceResponse(
                view.id(),
                view.slug(),
                view.title(),
                view.author(),
                view.status(),
                view.version(),
                view.evidenceStatus(),
                view.publishedAt()
        );
    }

    AdminModels.CommentResponse comment(GovernanceCommentView view) {
        return new AdminModels.CommentResponse(
                view.id(),
                view.resourceId(),
                view.resourceTitle(),
                view.author(),
                view.body(),
                view.status(),
                view.version(),
                view.createdAt()
        );
    }

    AdminModels.TaxonomyItem taxonomy(GovernanceTaxonomyView view) {
        return new AdminModels.TaxonomyItem(
                view.id(),
                view.kind(),
                view.slug(),
                view.label(),
                view.description(),
                view.parentId(),
                view.sortOrder(),
                view.status(),
                view.mergedIntoId(),
                view.version(),
                view.referenceCount()
        );
    }

    AdminModels.AuditEventResponse audit(AuditEventEntity event) {
        return new AdminModels.AuditEventResponse(
                event.getId(),
                event.getActorId(),
                event.getActionName(),
                event.getTargetType(),
                event.getTargetId(),
                event.getReason(),
                event.getRequestId(),
                event.getResultStatus(),
                event.getCreatedAt()
        );
    }

    AdminModels.PageInfo pageInfo(Page<?> page) {
        return new AdminModels.PageInfo(null, page.hasNext());
    }
}


package com.educhain.admin.service;

import com.educhain.audit.service.AuditService;
import com.educhain.externalcontent.dto.ExternalContentModels;
import com.educhain.externalcontent.service.ExternalContentService;
import com.educhain.externalcontent.service.ExternalContentSyncService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AdminExternalContentService {
    private final ExternalContentService content;
    private final ExternalContentSyncService sync;
    private final AuditService audit;
    private final TransactionTemplate transactions;

    public AdminExternalContentService(
            ExternalContentService content,
            ExternalContentSyncService sync,
            AuditService audit,
            PlatformTransactionManager transactionManager
    ) {
        this.content = content;
        this.sync = sync;
        this.audit = audit;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @Transactional
    public ExternalContentModels.SourceResponse create(
            UUID actorId,
            ExternalContentModels.SourceWriteRequest request,
            String requestId
    ) {
        var source = content.create(request);
        audit.succeeded(
                actorId,
                "EXTERNAL_SOURCE_CREATED",
                "EXTERNAL_SOURCE",
                source.id(),
                request.reason().trim(),
                requestId
        );
        return source;
    }

    @Transactional
    public ExternalContentModels.SourceResponse update(
            UUID actorId,
            UUID sourceId,
            long version,
            ExternalContentModels.SourceWriteRequest request,
            String requestId
    ) {
        var source = content.update(sourceId, version, request);
        audit.succeeded(
                actorId,
                "EXTERNAL_SOURCE_UPDATED",
                "EXTERNAL_SOURCE",
                sourceId,
                request.reason().trim(),
                requestId
        );
        return source;
    }

    @Transactional
    public ExternalContentModels.ItemResponse review(
            UUID actorId,
            UUID itemId,
            long version,
            ExternalContentModels.ReviewRequest request,
            String requestId
    ) {
        var item = content.review(itemId, version, request.status());
        audit.succeeded(
                actorId,
                "EXTERNAL_ITEM_REVIEWED",
                "EXTERNAL_ITEM",
                itemId,
                request.reason().trim(),
                requestId
        );
        return item;
    }

    public ExternalContentModels.SyncResponse sync(
            UUID actorId,
            UUID sourceId,
            String reason,
            String requestId
    ) {
        ExternalContentModels.SyncResponse result = sync.sync(sourceId);
        transactions.executeWithoutResult(ignored -> audit.succeeded(
                actorId,
                "EXTERNAL_SOURCE_SYNCED",
                "EXTERNAL_SOURCE",
                sourceId,
                reason,
                requestId
        ));
        return result;
    }
}

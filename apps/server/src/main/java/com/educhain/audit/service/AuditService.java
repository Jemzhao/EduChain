package com.educhain.audit.service;

import com.educhain.audit.entity.AuditEventEntity;
import com.educhain.audit.domain.AuditResultStatus;
import com.educhain.audit.repository.AuditEventRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void succeeded(
            UUID actorId,
            String action,
            String targetType,
            UUID targetId,
            String reason,
            String requestId
    ) {
        repository.save(new AuditEventEntity(
                actorId,
                action,
                targetType,
                targetId.toString(),
                reason,
                requestId,
                AuditResultStatus.SUCCEEDED,
                "{}"
        ));
    }

    @Transactional(readOnly = true)
    public Page<AuditEventEntity> list(String targetType, int limit) {
        PageRequest page = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (targetType == null || targetType.isBlank()) {
            return repository.findAll(page);
        }
        return repository.findAllByTargetTypeOrderByCreatedAtDesc(targetType.trim(), page);
    }
}

package com.educhain.audit.repository;

import com.educhain.audit.entity.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, UUID> {

    Page<AuditEventEntity> findAllByTargetTypeOrderByCreatedAtDesc(
            String targetType,
            Pageable pageable
    );
}

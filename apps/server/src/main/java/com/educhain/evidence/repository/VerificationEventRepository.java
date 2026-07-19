package com.educhain.evidence.repository;

import com.educhain.evidence.entity.VerificationEventEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationEventRepository
        extends JpaRepository<VerificationEventEntity, UUID> {
}

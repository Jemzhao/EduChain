package com.educhain.evidence.repository;

import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.entity.EvidenceJobEntity;
import com.educhain.evidence.domain.EvidenceJobStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvidenceJobRepository extends JpaRepository<EvidenceJobEntity, UUID> {

    Optional<EvidenceJobEntity> findByVersionIdAndBackendAndPayloadVersion(
            UUID versionId,
            EvidenceBackendType backend,
            short payloadVersion
    );

    Optional<EvidenceJobEntity> findFirstByResourceIdOrderByCreatedAtDesc(UUID resourceId);

    Optional<EvidenceJobEntity> findFirstByVersionIdOrderByCreatedAtDesc(UUID versionId);

    List<EvidenceJobEntity> findAllByVersionIdIn(Collection<UUID> versionIds);

    Optional<EvidenceJobEntity> findByIdAndStatusIn(
            UUID id,
            java.util.Collection<EvidenceJobStatus> statuses
    );

    long countByStatusInAndNextAttemptAtBefore(
            java.util.Collection<EvidenceJobStatus> statuses,
            Instant now
    );

    Page<EvidenceJobEntity> findAllByStatusOrderByUpdatedAtDesc(
            EvidenceJobStatus status,
            Pageable pageable
    );

    long countByStatusIn(java.util.Collection<EvidenceJobStatus> statuses);
}

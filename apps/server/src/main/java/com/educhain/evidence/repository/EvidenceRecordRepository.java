package com.educhain.evidence.repository;

import com.educhain.evidence.entity.EvidenceRecordEntity;
import com.educhain.evidence.domain.EvidenceBackendType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvidenceRecordRepository extends JpaRepository<EvidenceRecordEntity, UUID> {

    Optional<EvidenceRecordEntity> findByJobId(UUID jobId);

    Optional<EvidenceRecordEntity> findFirstByResourceIdOrderByConfirmedAtDesc(UUID resourceId);

    Optional<EvidenceRecordEntity> findByVersionId(UUID versionId);

    Optional<EvidenceRecordEntity> findFirstByContentDigestOrderByConfirmedAtDesc(
            String contentDigest
    );

    List<EvidenceRecordEntity> findAllByBlockHeightIsNotNullOrderByConfirmedAtDesc(
            Pageable pageable
    );

    List<EvidenceRecordEntity> findAllByBackendAndNetworkIdAndBlockHeightOrderByConfirmedAtAsc(
            EvidenceBackendType backend,
            String networkId,
            Long blockHeight
    );

    List<EvidenceRecordEntity> findAllByTransactionId(String transactionId);

    List<EvidenceRecordEntity> findAllByBlockHeightOrderByConfirmedAtDesc(
            Long blockHeight,
            Pageable pageable
    );

    long countByBackend(EvidenceBackendType backend);
}

package com.educhain.evidence.repository;

import com.educhain.evidence.entity.CertificateArtifactEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateArtifactRepository
        extends JpaRepository<CertificateArtifactEntity, UUID> {

    Optional<CertificateArtifactEntity> findByEvidenceRecordIdAndTemplateVersion(
            UUID evidenceRecordId,
            String templateVersion
    );

    Optional<CertificateArtifactEntity> findFirstByEvidenceRecordIdOrderByCreatedAtDesc(
            UUID evidenceRecordId
    );
}

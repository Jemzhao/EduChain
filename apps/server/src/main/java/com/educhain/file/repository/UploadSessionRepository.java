package com.educhain.file.repository;

import com.educhain.file.entity.UploadSessionEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadSessionRepository extends JpaRepository<UploadSessionEntity, UUID> {

    Optional<UploadSessionEntity> findByIdAndOwnerId(UUID id, UUID ownerId);
}

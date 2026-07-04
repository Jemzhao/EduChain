package com.educhain.auth.repository;

import com.educhain.auth.entity.RefreshSessionEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshSessionRepository extends JpaRepository<RefreshSessionEntity, UUID> {

    Optional<RefreshSessionEntity> findByTokenHash(String tokenHash);

    Optional<RefreshSessionEntity> findByIdAndUserId(UUID id, UUID userId);

    List<RefreshSessionEntity> findAllByUserIdAndRevokedAtIsNullAndRotatedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            UUID userId,
            Instant now
    );

    List<RefreshSessionEntity> findAllBySessionFamilyId(UUID sessionFamilyId);

    List<RefreshSessionEntity> findAllByUserId(UUID userId);
}

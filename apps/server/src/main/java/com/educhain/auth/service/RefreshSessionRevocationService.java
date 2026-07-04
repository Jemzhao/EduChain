package com.educhain.auth.service;

import com.educhain.auth.repository.RefreshSessionRepository;
import com.educhain.platform.port.SessionRevocationPort;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshSessionRevocationService implements SessionRevocationPort {

    private final RefreshSessionRepository repository;
    private final Clock clock;

    public RefreshSessionRevocationService(RefreshSessionRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void revokeActiveSessions(UUID userId) {
        var now = clock.instant();
        repository
                .findAllByUserIdAndRevokedAtIsNullAndRotatedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        userId,
                        now
                )
                .forEach(session -> session.revoke(now));
    }
}

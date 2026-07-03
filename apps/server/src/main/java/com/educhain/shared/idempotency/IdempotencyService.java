package com.educhain.shared.idempotency;

import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {

    private static final Duration RECORD_TTL = Duration.ofHours(24);

    private final IdempotencyRecordRepository repository;
    private final Clock clock;

    public IdempotencyService(IdempotencyRecordRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public Optional<String> begin(String scope, String key, String requestDigest) {
        Optional<IdempotencyRecordEntity> existing = repository
                .findByScopeNameAndIdempotencyKey(scope, key);
        if (existing.isPresent()) {
            IdempotencyRecordEntity record = existing.orElseThrow();
            if (!record.getRequestDigest().equals(requestDigest)) {
                throw conflict();
            }
            if (record.getExpiresAt().isBefore(clock.instant())) {
                throw conflict();
            }
            if (record.getResultReference() == null) {
                throw conflict();
            }
            return Optional.of(record.getResultReference());
        }

        repository.save(new IdempotencyRecordEntity(
                scope,
                key,
                requestDigest,
                clock.instant().plus(RECORD_TTL)
        ));
        return Optional.empty();
    }

    public void complete(
            String scope,
            String key,
            UUID actorId,
            String resultReference,
            int responseStatus
    ) {
        IdempotencyRecordEntity record = repository
                .findByScopeNameAndIdempotencyKey(scope, key)
                .orElseThrow();
        record.complete(actorId, resultReference, responseStatus);
    }

    private ApiException conflict() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.IDEMPOTENCY_CONFLICT,
                "Idempotency key conflicts with another request",
                false,
                Map.of()
        );
    }
}

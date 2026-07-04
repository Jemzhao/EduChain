package com.educhain.auth.service;

import com.educhain.auth.repository.AuthCredentialRepository;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CredentialAttemptService {

    private final AuthCredentialRepository credentialRepository;
    private final Clock clock;

    public CredentialAttemptService(
            AuthCredentialRepository credentialRepository,
            Clock clock
    ) {
        this.credentialRepository = credentialRepository;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(UUID userId) {
        credentialRepository.findById(userId)
                .ifPresent(credential -> credential.recordFailure(clock.instant()));
    }
}

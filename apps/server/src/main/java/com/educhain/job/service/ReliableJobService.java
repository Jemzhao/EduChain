package com.educhain.job.service;

import com.educhain.job.entity.ReliableJobEntity;
import com.educhain.job.repository.ReliableJobRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReliableJobService {

    private final ReliableJobRepository repository;
    private final Clock clock;

    public ReliableJobService(ReliableJobRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public Optional<ClaimedReliableJob> claim(String jobType, Duration leaseDuration) {
        Instant now = clock.instant();
        return repository.findClaimable(jobType, now, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(job -> {
                    job.claim(now.plus(leaseDuration));
                    return new ClaimedReliableJob(
                            job.getId(),
                            job.getJobType(),
                            job.getBusinessKey(),
                            job.getPayload(),
                            job.getAttemptCount()
                    );
                });
    }

    @Transactional
    public void complete(UUID jobId) {
        repository.findById(jobId).ifPresent(job -> job.complete());
    }

    @Transactional
    public void reschedule(UUID jobId, Instant availableAt, String errorCode) {
        repository.findById(jobId).ifPresent(job -> job.reschedule(availableAt, errorCode));
    }

    @Transactional
    public void terminate(UUID jobId, String errorCode) {
        repository.findById(jobId).ifPresent(job -> job.terminate(errorCode));
    }

    @Transactional
    public boolean manualRetry(String jobType, String businessKey) {
        Optional<ReliableJobEntity> found = repository.findByJobTypeAndBusinessKey(
                jobType,
                businessKey
        );
        if (found.isEmpty()) {
            return false;
        }
        ReliableJobEntity job = found.get();
        job.manualRetry(clock.instant());
        return true;
    }
}

package com.educhain.job.service;

import java.util.UUID;

public record ClaimedReliableJob(
        UUID id,
        String jobType,
        String businessKey,
        String payload,
        int attemptCount
) {
}

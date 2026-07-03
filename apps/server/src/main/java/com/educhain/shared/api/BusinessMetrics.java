package com.educhain.shared.api;

import com.educhain.shared.error.ErrorCode;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class BusinessMetrics {

    private final MeterRegistry registry;

    public BusinessMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void authentication(String operation, String outcome) {
        registry.counter(
                "educhain.authentication.operations",
                "operation",
                operation,
                "outcome",
                outcome
        ).increment();
    }

    public void publication(String outcome) {
        registry.counter("educhain.resource.publications", "outcome", outcome).increment();
    }

    public void search(boolean empty) {
        registry.counter("educhain.search.requests", "outcome", empty ? "empty" : "matched")
                .increment();
    }

    public void evidence(String operation, String outcome) {
        registry.counter(
                "educhain.evidence.operations",
                "operation",
                operation,
                "outcome",
                outcome
        ).increment();
    }

    public void businessError(ErrorCode code, int status) {
        registry.counter(
                "educhain.api.business_errors",
                "code",
                code.name(),
                "status",
                Integer.toString(status)
        ).increment();
    }
}

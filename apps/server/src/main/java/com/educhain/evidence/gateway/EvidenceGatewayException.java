package com.educhain.evidence.gateway;

public class EvidenceGatewayException extends RuntimeException {

    private final String code;
    private final boolean retryable;
    private final boolean resultUnknown;

    public EvidenceGatewayException(
            String code,
            String message,
            boolean retryable,
            boolean resultUnknown
    ) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.resultUnknown = resultUnknown;
    }

    public String code() {
        return code;
    }

    public boolean retryable() {
        return retryable;
    }

    public boolean resultUnknown() {
        return resultUnknown;
    }
}

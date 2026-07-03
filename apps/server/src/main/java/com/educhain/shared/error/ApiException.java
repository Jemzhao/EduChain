package com.educhain.shared.error;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode code;
    private final String title;
    private final boolean retryable;
    private final Map<String, String> parameters;

    public ApiException(
            HttpStatus status,
            ErrorCode code,
            String title,
            boolean retryable,
            Map<String, String> parameters
    ) {
        super(code.name());
        this.status = status;
        this.code = code;
        this.title = title;
        this.retryable = retryable;
        this.parameters = Map.copyOf(parameters);
    }

    public HttpStatus status() {
        return status;
    }

    public ErrorCode code() {
        return code;
    }

    public String title() {
        return title;
    }

    public boolean retryable() {
        return retryable;
    }

    public Map<String, String> parameters() {
        return parameters;
    }
}

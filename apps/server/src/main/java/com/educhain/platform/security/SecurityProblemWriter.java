package com.educhain.platform.security;

import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.error.ErrorCode;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
public class SecurityProblemWriter {

    private final ObjectMapper objectMapper;

    public SecurityProblemWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            ErrorCode code,
            String title
    ) throws IOException {
        write(request, response, status, code, title, false);
    }

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            ErrorCode code,
            String title,
            boolean retryable
    ) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        Object requestId = request.getAttribute(RequestIdFilter.ATTRIBUTE_NAME);
        Map<String, Object> body = Map.of(
                "type", "/problems/" + code.name().toLowerCase(Locale.ROOT).replace('_', '-'),
                "title", title,
                "status", status,
                "code", code.name(),
                "instance", request.getRequestURI(),
                "requestId", requestId == null ? "unavailable" : requestId.toString(),
                "retryable", retryable,
                "parameters", Map.of()
        );
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}

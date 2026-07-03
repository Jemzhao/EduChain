package com.educhain.shared.error;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.api.BusinessMetrics;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private final BusinessMetrics metrics;

    public ApiExceptionHandler(BusinessMetrics metrics) {
        this.metrics = metrics;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApiException(
            ApiException exception,
            HttpServletRequest request
    ) {
        metrics.businessError(exception.code(), exception.status().value());
        ProblemDetail problem = createProblem(
                request,
                exception.status(),
                exception.code(),
                exception.title(),
                exception.retryable(),
                exception.parameters()
        );
        return ResponseEntity.status(exception.status()).body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<FieldViolation> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldViolation)
                .toList();
        ProblemDetail problem = createProblem(
                request,
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.FIELD_VALIDATION_FAILED,
                "Request fields are invalid",
                false,
                Map.of()
        );
        problem.setProperty("fieldErrors", fieldErrors);
        return ResponseEntity.unprocessableContent().body(problem);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingRequestHeaderException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ProblemDetail> handleInvalidRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        ProblemDetail problem = createProblem(
                request,
                HttpStatus.BAD_REQUEST,
                ErrorCode.REQUEST_INVALID,
                "Request is invalid",
                false,
                Map.of()
        );
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> handleOptimisticConflict(
            ObjectOptimisticLockingFailureException exception,
            HttpServletRequest request
    ) {
        ProblemDetail problem = createProblem(
                request,
                HttpStatus.CONFLICT,
                ErrorCode.VERSION_CONFLICT,
                "Object changed while the request was being processed",
                false,
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(
            Exception exception,
            HttpServletRequest request
    ) {
        String requestId = requestId(request);
        log.error("Unexpected request failure", exception);
        ProblemDetail problem = createProblem(
                request,
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.UNEXPECTED_ERROR,
                "Request could not be completed",
                false,
                Map.of()
        );
        problem.setProperty("requestId", requestId);
        return ResponseEntity.internalServerError().body(problem);
    }

    private ProblemDetail createProblem(
            HttpServletRequest request,
            HttpStatus status,
            ErrorCode code,
            String title,
            boolean retryable,
            Map<String, String> parameters
    ) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(URI.create("/problems/" + code.name().toLowerCase(Locale.ROOT).replace('_', '-')));
        problem.setTitle(title);
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", code.name());
        problem.setProperty("requestId", requestId(request));
        problem.setProperty("retryable", retryable);
        problem.setProperty("parameters", Map.copyOf(parameters));
        return problem;
    }

    private FieldViolation toFieldViolation(FieldError error) {
        String validationType = error.getCode();
        String code = switch (validationType == null ? "" : validationType) {
            case "NotBlank", "NotEmpty", "NotNull" -> "FIELD_REQUIRED";
            case "Email" -> "FIELD_EMAIL_INVALID";
            case "Size" -> "FIELD_SIZE_INVALID";
            case "Pattern" -> "FIELD_FORMAT_INVALID";
            default -> "FIELD_INVALID";
        };
        String rejectedType = error.getRejectedValue() == null
                ? "null"
                : error.getRejectedValue().getClass().getSimpleName();
        return new FieldViolation(error.getField(), code, Map.of("rejectedType", rejectedType));
    }

    private String requestId(HttpServletRequest request) {
        Object requestId = request.getAttribute(RequestIdFilter.ATTRIBUTE_NAME);
        return requestId == null ? "unavailable" : requestId.toString();
    }
}

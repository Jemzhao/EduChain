package com.educhain.platform.security;

import com.educhain.auth.config.AuthProperties;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.error.ErrorCode;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final DefaultRedisScript<Long> INCREMENT = new DefaultRedisScript<>("""
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
              redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return current
            """, Long.class);

    private final StringRedisTemplate redis;
    private final SecurityProblemWriter problemWriter;
    private final RateLimitProperties properties;
    private final byte[] keySecret;
    private final Counter storeFailures;
    private final MeterRegistry meterRegistry;

    public RateLimitFilter(
            StringRedisTemplate redis,
            SecurityProblemWriter problemWriter,
            RateLimitProperties properties,
            AuthProperties authProperties,
            MeterRegistry meterRegistry
    ) {
        this.redis = redis;
        this.problemWriter = problemWriter;
        this.properties = properties;
        this.keySecret = authProperties.sessionSecret().getBytes(StandardCharsets.UTF_8);
        this.meterRegistry = meterRegistry;
        this.storeFailures = meterRegistry.counter("educhain.rate_limit.store_failures");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.enabled() || policy(request) == null;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Policy policy = policy(request);
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            Long count = redis.execute(
                    INCREMENT,
                    List.of("educhain:rate:" + policy.name() + ":" + subject(request)),
                    Long.toString(Math.max(1, properties.window().toSeconds()))
            );
            if (count != null && count > policy.limit()) {
                meterRegistry.counter("educhain.rate_limit.rejections", "policy", policy.name())
                        .increment();
                response.setHeader(
                        "Retry-After",
                        Long.toString(Math.max(1, properties.window().toSeconds()))
                );
                problemWriter.write(
                        request,
                        response,
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        ErrorCode.RATE_LIMITED,
                        "Request rate limit exceeded",
                        true
                );
                return;
            }
        } catch (RedisConnectionFailureException exception) {
            storeFailures.increment();
        } catch (DataAccessException exception) {
            storeFailures.increment();
        }
        filterChain.doFilter(request, response);
    }

    private Policy policy(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        if ("POST".equals(method)
                && ("/api/v1/auth/sessions".equals(path)
                    || "/api/v1/auth/registrations".equals(path))) {
            return new Policy("authentication", properties.authenticationRequests());
        }
        if ("POST".equals(method) && "/api/v1/verifications".equals(path)) {
            return new Policy("verification", properties.verificationRequests());
        }
        if (path.startsWith("/api/v1/")
                && !"GET".equals(method)
                && !"HEAD".equals(method)
                && !"OPTIONS".equals(method)) {
            return new Policy("write", properties.writeRequests());
        }
        return null;
    }

    private String subject(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof EduChainPrincipal principal) {
            return "user:" + principal.userId();
        }
        return "network:" + hmac(request.getRemoteAddr());
    }

    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable", exception);
        }
    }

    private record Policy(String name, int limit) {
    }
}

package com.educhain.platform.security;

import com.educhain.auth.config.AuthProperties;
import com.educhain.auth.security.SessionAuthenticationFilter;
import com.educhain.auth.security.SpaCsrfTokenRequestHandler;
import com.educhain.shared.error.ErrorCode;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties({
    WebSecurityProperties.class,
    RateLimitProperties.class,
    RuntimeSafetyProperties.class
})
public class SecurityConfiguration {

    @Bean
    RateLimitFilter rateLimitFilter(
            StringRedisTemplate redis,
            SecurityProblemWriter problemWriter,
            RateLimitProperties properties,
            AuthProperties authProperties,
            MeterRegistry meterRegistry
    ) {
        return new RateLimitFilter(
                redis,
                problemWriter,
                properties,
                authProperties,
                meterRegistry
        );
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(WebSecurityProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Content-Type",
                "X-CSRF-TOKEN",
                "X-XSRF-TOKEN",
                "X-Request-Id",
                "Idempotency-Key",
                "If-Match"
        ));
        configuration.setExposedHeaders(List.of("X-Request-Id", "Retry-After", "ETag"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    SecurityFilterChain apiSecurity(
            HttpSecurity http,
            SessionAuthenticationFilter sessionAuthenticationFilter,
            RateLimitFilter rateLimitFilter,
            SecurityProblemWriter problemWriter,
            AuthProperties authProperties
    ) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieCustomizer(cookie -> cookie
                .path("/")
                .sameSite("Lax")
                .secure(authProperties.secureCookies()));

        return http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .cors(Customizer.withDefaults())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> problemWriter.write(
                                request,
                                response,
                                HttpStatus.UNAUTHORIZED.value(),
                                ErrorCode.AUTHENTICATION_REQUIRED,
                                "Authentication is required"
                        ))
                        .accessDeniedHandler((request, response, exception) -> problemWriter.write(
                                request,
                                response,
                                HttpStatus.FORBIDDEN.value(),
                                ErrorCode.ACCESS_DENIED,
                                "Access is denied"
                        )))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf-token").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/registrations").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/sessions").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/sessions/current").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/token-refreshes").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/password-reset-requests",
                                "/api/v1/auth/password-resets",
                                "/api/v1/resources/*/views"
                        ).permitAll()
                        .requestMatchers("/api/v1/users/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/*").permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/users/*/followers",
                                "/api/v1/users/*/following"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categories", "/api/v1/tags").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/platform-settings").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources", "/api/v1/resources/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources/*/evidence").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources/*/comments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/resources/*/statistics").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/recommendations/resources").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/search/**").permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/community",
                                "/api/v1/achievements",
                                "/api/v1/leaderboards/contributors"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/evidence/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/ledger/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/external-content").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/*/content").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/verifications").permitAll()
                        .requestMatchers("/api/v1/auth/sessions/**").authenticated()
                        .requestMatchers("/api/v1/resources/**").authenticated()
                        .requestMatchers("/api/v1/comments/**", "/api/v1/collections/**").authenticated()
                        .requestMatchers("/api/v1/users/*/follow").authenticated()
                        .requestMatchers("/api/v1/users/me/achievements").authenticated()
                        .requestMatchers("/api/v1/users/me/**").authenticated()
                        .requestMatchers("/api/v1/recommendations/**").authenticated()
                        .requestMatchers("/api/v1/evidence-jobs/**").authenticated()
                        .requestMatchers("/api/v1/reports").authenticated()
                        .requestMatchers("/api/v1/support/tickets/**").authenticated()
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("MODERATOR", "ADMINISTRATOR")
                        .requestMatchers(
                                "/api/v1/notifications/**",
                                "/api/v1/notification-read-batches",
                                "/api/v1/notification-deletion-batches",
                                "/api/v1/notification-preferences"
                        ).authenticated()
                        .requestMatchers("/api/v1/uploads/**", "/api/v1/files/**").authenticated()
                        .requestMatchers("/actuator/health/liveness", "/actuator/health/readiness").permitAll()
                        .anyRequest().denyAll())
                .addFilterBefore(sessionAuthenticationFilter, AnonymousAuthenticationFilter.class)
                .addFilterAfter(rateLimitFilter, SessionAuthenticationFilter.class)
                .build();
    }
}

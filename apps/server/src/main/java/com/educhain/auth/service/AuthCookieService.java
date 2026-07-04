package com.educhain.auth.service;

import com.educhain.auth.config.AuthProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

    private static final String ACCESS_PATH = "/";
    private static final String REFRESH_PATH = "/api/v1/auth/token-refreshes";

    private final AuthProperties properties;

    public AuthCookieService(AuthProperties properties) {
        this.properties = properties;
    }

    public void write(HttpServletResponse response, SessionCredentials credentials) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                AuthProperties.SESSION_COOKIE,
                credentials.accessToken(),
                ACCESS_PATH,
                properties.accessTokenTtl()
        ).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                AuthProperties.REFRESH_COOKIE,
                credentials.refreshToken(),
                REFRESH_PATH,
                properties.refreshTokenTtl()
        ).toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                AuthProperties.SESSION_COOKIE,
                "",
                ACCESS_PATH,
                Duration.ZERO
        ).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(
                AuthProperties.REFRESH_COOKIE,
                "",
                REFRESH_PATH,
                Duration.ZERO
        ).toString());
    }

    public Optional<String> refreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> AuthProperties.REFRESH_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private ResponseCookie cookie(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(properties.secureCookies())
                .sameSite("Lax")
                .path(path)
                .maxAge(maxAge)
                .build();
    }
}

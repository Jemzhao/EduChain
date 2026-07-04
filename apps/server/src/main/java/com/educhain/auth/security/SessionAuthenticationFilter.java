package com.educhain.auth.security;

import com.educhain.auth.config.AuthProperties;
import com.educhain.auth.service.AuthenticationService;
import com.educhain.platform.security.EduChainPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final AccessTokenCodec accessTokenCodec;
    private final AuthenticationService authenticationService;

    public SessionAuthenticationFilter(
            AccessTokenCodec accessTokenCodec,
            AuthenticationService authenticationService
    ) {
        this.accessTokenCodec = accessTokenCodec;
        this.authenticationService = authenticationService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            accessCookie(request)
                    .flatMap(accessTokenCodec::decode)
                    .flatMap(identity -> authenticationService.resolvePrincipal(
                            identity.userId(),
                            identity.sessionId()
                    ))
                    .ifPresent(this::authenticate);
        }
        filterChain.doFilter(request, response);
    }

    private Optional<String> accessCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> AuthProperties.SESSION_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private void authenticate(EduChainPrincipal principal) {
        var authorities = principal.roles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                authorities
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}

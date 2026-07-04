package com.educhain.auth.controller;

import com.educhain.auth.dto.AuthenticatedUserResponse;
import com.educhain.auth.dto.CsrfTokenResponse;
import com.educhain.auth.dto.LoginRequest;
import com.educhain.auth.dto.PasswordChangeRequest;
import com.educhain.auth.dto.PasswordResetCompletionRequest;
import com.educhain.auth.dto.PasswordResetRequest;
import com.educhain.auth.dto.PasswordResetRequestResponse;
import com.educhain.auth.dto.RegistrationRequest;
import com.educhain.auth.dto.SessionListResponse;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.auth.service.AuthCookieService;
import com.educhain.auth.service.AuthenticationResult;
import com.educhain.auth.service.AuthenticationService;
import com.educhain.auth.service.ClientContext;
import com.educhain.auth.service.TokenGenerator;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.dto.CurrentUserResponse;
import com.educhain.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final AuthCookieService cookieService;
    private final TokenGenerator tokenGenerator;
    private final UserService userService;

    public AuthenticationController(
            AuthenticationService authenticationService,
            AuthCookieService cookieService,
            TokenGenerator tokenGenerator,
            UserService userService
    ) {
        this.authenticationService = authenticationService;
        this.cookieService = cookieService;
        this.tokenGenerator = tokenGenerator;
        this.userService = userService;
    }

    @GetMapping("/csrf-token")
    public CsrfTokenResponse csrfToken(CsrfToken csrfToken) {
        return new CsrfTokenResponse(csrfToken.getToken(), csrfToken.getHeaderName());
    }

    @PostMapping("/registrations")
    public ResponseEntity<AuthenticatedUserResponse> register(
            @RequestHeader("Idempotency-Key") @Size(min = 16, max = 128) String idempotencyKey,
            @Valid @RequestBody RegistrationRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthenticationResult result = authenticationService.register(
                idempotencyKey,
                requestBody,
                ClientContext.from(request, tokenGenerator)
        );
        cookieService.write(response, result.credentials());
        return ResponseEntity.status(HttpStatus.CREATED).body(result.response());
    }

    @PostMapping("/sessions")
    public AuthenticatedUserResponse login(
            @Valid @RequestBody LoginRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthenticationResult result = authenticationService.login(
                requestBody,
                ClientContext.from(request, tokenGenerator)
        );
        cookieService.write(response, result.credentials());
        return result.response();
    }

    @GetMapping("/sessions")
    public SessionListResponse sessions(@AuthenticationPrincipal EduChainPrincipal principal) {
        return authenticationService.listSessions(principal);
    }

    @GetMapping("/sessions/current")
    public ResponseEntity<CurrentUserResponse> currentSession(
            @AuthenticationPrincipal EduChainPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(userService.getCurrentUser(principal.userId()));
    }

    @DeleteMapping("/sessions/current")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal EduChainPrincipal principal,
            HttpServletResponse response
    ) {
        authenticationService.revokeCurrent(principal);
        cookieService.clear(response);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID sessionId,
            HttpServletResponse response
    ) {
        authenticationService.revoke(principal, sessionId);
        if (sessionId.equals(principal.sessionId())) {
            cookieService.clear(response);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/token-refreshes")
    public ResponseEntity<Void> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = cookieService.refreshToken(request)
                .orElseThrow(this::sessionExpired);
        AuthenticationResult result = authenticationService.refresh(
                refreshToken,
                ClientContext.from(request, tokenGenerator)
        );
        cookieService.write(response, result.credentials());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password-reset-requests")
    public ResponseEntity<PasswordResetRequestResponse> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request
    ) {
        return ResponseEntity.accepted().body(
                authenticationService.requestPasswordReset(request)
        );
    }

    @PostMapping("/password-resets")
    public ResponseEntity<Void> completePasswordReset(
            @Valid @RequestBody PasswordResetCompletionRequest request,
            HttpServletResponse response
    ) {
        authenticationService.completePasswordReset(request);
        cookieService.clear(response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password-changes")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody PasswordChangeRequest request,
            HttpServletResponse response
    ) {
        authenticationService.changePassword(principal, request);
        cookieService.clear(response);
        return ResponseEntity.noContent().build();
    }

    private ApiException sessionExpired() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                ErrorCode.SESSION_EXPIRED,
                "Session is no longer valid",
                false,
                Map.of()
        );
    }
}

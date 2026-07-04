package com.educhain.auth.service;

import com.educhain.auth.config.AuthProperties;
import com.educhain.auth.dto.AuthenticatedUserResponse;
import com.educhain.auth.dto.LoginRequest;
import com.educhain.auth.dto.PasswordChangeRequest;
import com.educhain.auth.dto.PasswordResetCompletionRequest;
import com.educhain.auth.dto.PasswordResetRequest;
import com.educhain.auth.dto.PasswordResetRequestResponse;
import com.educhain.auth.dto.RegistrationRequest;
import com.educhain.auth.dto.SessionListResponse;
import com.educhain.auth.dto.SessionSummaryResponse;
import com.educhain.auth.entity.AuthCredentialEntity;
import com.educhain.auth.entity.RefreshSessionEntity;
import com.educhain.auth.entity.PasswordResetTokenEntity;
import com.educhain.auth.repository.AuthCredentialRepository;
import com.educhain.auth.repository.RefreshSessionRepository;
import com.educhain.auth.repository.PasswordResetTokenRepository;
import com.educhain.auth.security.AccessTokenCodec;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.shared.idempotency.IdempotencyService;
import com.educhain.shared.api.BusinessMetrics;
import com.educhain.platform.security.RuntimeSafetyProperties;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.service.AuthenticationView;
import com.educhain.user.service.RegisteredAccount;
import com.educhain.user.service.UserService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final AuthCredentialRepository credentialRepository;
    private final RefreshSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessTokenCodec accessTokenCodec;
    private final TokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;
    private final CredentialAttemptService credentialAttemptService;
    private final IdempotencyService idempotencyService;
    private final String dummyPasswordHash;
    private final BusinessMetrics metrics;
    private final PasswordResetTokenRepository passwordResetRepository;
    private final PasswordResetDelivery passwordResetDelivery;
    private final RuntimeSafetyProperties runtimeSafety;

    public AuthenticationService(
            UserService userService,
            AuthCredentialRepository credentialRepository,
            RefreshSessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            AccessTokenCodec accessTokenCodec,
            TokenGenerator tokenGenerator,
            AuthProperties properties,
            Clock clock,
            CredentialAttemptService credentialAttemptService,
            IdempotencyService idempotencyService,
            BusinessMetrics metrics,
            PasswordResetTokenRepository passwordResetRepository,
            ObjectProvider<PasswordResetDelivery> passwordResetDelivery,
            RuntimeSafetyProperties runtimeSafety
    ) {
        this.userService = userService;
        this.credentialRepository = credentialRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessTokenCodec = accessTokenCodec;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.clock = clock;
        this.credentialAttemptService = credentialAttemptService;
        this.idempotencyService = idempotencyService;
        this.metrics = metrics;
        this.passwordResetRepository = passwordResetRepository;
        this.passwordResetDelivery = passwordResetDelivery.getIfAvailable();
        this.runtimeSafety = runtimeSafety;
        this.dummyPasswordHash = passwordEncoder.encode(tokenGenerator.generate());
    }

    @Transactional
    public AuthenticationResult register(
            String idempotencyKey,
            RegistrationRequest request,
            ClientContext clientContext
    ) {
        String digest = registrationDigest(request);
        Optional<String> replayReference = idempotencyService.begin(
                "AUTH_REGISTRATION",
                idempotencyKey,
                digest
        );
        if (replayReference.isPresent()) {
            UUID userId = UUID.fromString(replayReference.orElseThrow());
            AuthenticationView existing = userService.requireForAuthentication(userId);
            metrics.authentication("registration", "replayed");
            return createAuthenticatedSession(existing, clientContext, UUID.randomUUID());
        }

        try {
            RegisteredAccount account = userService.register(
                    request.email(),
                    request.handle(),
                    request.displayName()
            );
            credentialRepository.save(new AuthCredentialEntity(
                    account.userId(),
                    passwordEncoder.encode(request.password()),
                    clock.instant()
            ));
            idempotencyService.complete(
                    "AUTH_REGISTRATION",
                    idempotencyKey,
                    account.userId(),
                    account.userId().toString(),
                    HttpStatus.CREATED.value()
            );
            AuthenticationView view = userService.requireForAuthentication(account.userId());
            metrics.authentication("registration", "succeeded");
            return createAuthenticatedSession(view, clientContext, UUID.randomUUID());
        } catch (DataIntegrityViolationException exception) {
            metrics.authentication("registration", "rejected");
            throw identifierTaken();
        }
    }

    @Transactional
    public AuthenticationResult login(LoginRequest request, ClientContext clientContext) {
        Optional<AuthenticationView> candidate = userService.findForAuthentication(
                request.identifier()
        );
        if (candidate.isEmpty()) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            metrics.authentication("login", "rejected");
            throw invalidCredentials();
        }

        AuthenticationView view = candidate.orElseThrow();
        AuthCredentialEntity credential = credentialRepository.findById(view.userId())
                .orElseThrow(this::invalidCredentials);
        Instant now = clock.instant();
        if (credential.isLocked(now)
                || !passwordEncoder.matches(request.password(), credential.getPasswordHash())) {
            credentialAttemptService.recordFailure(credential.getUserId());
            metrics.authentication("login", "rejected");
            throw invalidCredentials();
        }

        requireActive(view.status());
        credential.recordSuccess();
        metrics.authentication("login", "succeeded");
        return createAuthenticatedSession(view, clientContext, UUID.randomUUID());
    }

    @Transactional
    public AuthenticationResult refresh(String rawRefreshToken, ClientContext clientContext) {
        Instant now = clock.instant();
        RefreshSessionEntity current = sessionRepository
                .findByTokenHash(tokenGenerator.hash(rawRefreshToken))
                .orElseThrow(this::sessionExpired);
        if (current.wasRotatedOrRevoked()) {
            revokeFamily(current.getSessionFamilyId(), now);
            throw sessionExpired();
        }
        if (!current.isUsable(now)) {
            current.revoke(now);
            throw sessionExpired();
        }

        AuthenticationView view = userService.requireForAuthentication(current.getUserId());
        requireActive(view.status());
        current.rotate(now);
        return createAuthenticatedSession(view, clientContext, current.getSessionFamilyId());
    }

    @Transactional(readOnly = true)
    public Optional<EduChainPrincipal> resolvePrincipal(UUID userId, UUID sessionId) {
        Instant now = clock.instant();
        Optional<RefreshSessionEntity> session = sessionRepository.findByIdAndUserId(
                sessionId,
                userId
        );
        if (session.isEmpty() || !session.orElseThrow().isUsable(now)) {
            return Optional.empty();
        }
        AuthenticationView view = userService.requireForAuthentication(userId);
        if (view.status() != UserStatus.ACTIVE) {
            return Optional.empty();
        }
        return Optional.of(new EduChainPrincipal(
                view.userId(),
                sessionId,
                view.handle(),
                view.roles().stream().map(Enum::name).toList()
        ));
    }

    @Transactional(readOnly = true)
    public SessionListResponse listSessions(EduChainPrincipal principal) {
        List<SessionSummaryResponse> items = sessionRepository
                .findAllByUserIdAndRevokedAtIsNullAndRotatedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        principal.userId(),
                        clock.instant()
                )
                .stream()
                .map(session -> new SessionSummaryResponse(
                        session.getId(),
                        session.getId().equals(principal.sessionId()),
                        session.getDeviceLabel(),
                        session.getCreatedAt(),
                        session.getExpiresAt()
                ))
                .toList();
        return new SessionListResponse(items);
    }

    @Transactional
    public void revokeCurrent(EduChainPrincipal principal) {
        sessionRepository.findByIdAndUserId(principal.sessionId(), principal.userId())
                .ifPresent(session -> session.revoke(clock.instant()));
    }

    @Transactional
    public void revoke(EduChainPrincipal principal, UUID sessionId) {
        RefreshSessionEntity session = sessionRepository.findByIdAndUserId(
                        sessionId,
                        principal.userId()
                )
                .orElseThrow(this::notFound);
        session.revoke(clock.instant());
    }

    @Transactional
    public void changePassword(EduChainPrincipal principal, PasswordChangeRequest request) {
        AuthCredentialEntity credential = credentialRepository.findById(principal.userId())
                .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.currentPassword(), credential.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (passwordEncoder.matches(request.newPassword(), credential.getPasswordHash())) {
            throw passwordReuseNotAllowed();
        }
        Instant now = clock.instant();
        credential.changePassword(passwordEncoder.encode(request.newPassword()), now);
        revokeAllSessions(principal.userId(), now);
        metrics.authentication("password_change", "succeeded");
    }

    @Transactional
    public PasswordResetRequestResponse requestPasswordReset(PasswordResetRequest request) {
        String rawToken = tokenGenerator.generate();
        Optional<AuthenticationView> account = userService.findForAuthentication(request.email());
        if (account.isPresent()) {
            AuthenticationView view = account.orElseThrow();
            Instant now = clock.instant();
            passwordResetRepository.findAllByUserIdAndConsumedAtIsNull(view.userId())
                    .forEach(token -> token.consume(now));
            passwordResetRepository.save(new PasswordResetTokenEntity(
                    view.userId(),
                    tokenGenerator.hash(rawToken),
                    now.plus(properties.passwordResetTtl())
            ));
            if (passwordResetDelivery != null) {
                passwordResetDelivery.send(view.email(), rawToken);
            }
        }
        metrics.authentication("password_reset_request", "accepted");
        return new PasswordResetRequestResponse(true, localPreview(rawToken));
    }

    @Transactional
    public void completePasswordReset(PasswordResetCompletionRequest request) {
        Instant now = clock.instant();
        PasswordResetTokenEntity resetToken = passwordResetRepository
                .findByTokenHash(tokenGenerator.hash(request.token()))
                .orElseThrow(this::passwordResetInvalid);
        if (!resetToken.isUsable(now)) {
            throw passwordResetInvalid();
        }
        AuthCredentialEntity credential = credentialRepository.findById(resetToken.getUserId())
                .orElseThrow(this::passwordResetInvalid);
        if (passwordEncoder.matches(request.newPassword(), credential.getPasswordHash())) {
            throw passwordReuseNotAllowed();
        }
        credential.changePassword(passwordEncoder.encode(request.newPassword()), now);
        resetToken.consume(now);
        revokeAllSessions(resetToken.getUserId(), now);
        metrics.authentication("password_reset", "succeeded");
    }

    private AuthenticationResult createAuthenticatedSession(
            AuthenticationView view,
            ClientContext clientContext,
            UUID familyId
    ) {
        Instant now = clock.instant();
        UUID sessionId = UUID.randomUUID();
        String refreshToken = tokenGenerator.generate();
        RefreshSessionEntity session = new RefreshSessionEntity(
                sessionId,
                view.userId(),
                tokenGenerator.hash(refreshToken),
                familyId,
                clientContext.deviceLabel(),
                clientContext.userAgentHash(),
                clientContext.ipPrefixHash(),
                now.plus(properties.refreshTokenTtl())
        );
        sessionRepository.save(session);
        String accessToken = accessTokenCodec.issue(
                view.userId(),
                sessionId,
                view.handle(),
                view.roles()
        );
        return new AuthenticationResult(
                new AuthenticatedUserResponse(view.summary()),
                new SessionCredentials(sessionId, accessToken, refreshToken)
        );
    }

    private void revokeFamily(UUID familyId, Instant now) {
        sessionRepository.findAllBySessionFamilyId(familyId)
                .forEach(session -> session.revoke(now));
    }

    private void revokeAllSessions(UUID userId, Instant now) {
        sessionRepository.findAllByUserId(userId).forEach(session -> session.revoke(now));
    }

    private String localPreview(String rawToken) {
        return runtimeSafety.environment() == RuntimeSafetyProperties.Environment.LOCAL
                ? rawToken
                : null;
    }

    private String registrationDigest(RegistrationRequest request) {
        String canonical = String.join(
                "\n",
                request.email().trim().toLowerCase(Locale.ROOT),
                request.handle().trim().toLowerCase(Locale.ROOT),
                request.displayName().trim(),
                request.password()
        );
        return tokenGenerator.hash(canonical);
    }

    private void requireActive(UserStatus status) {
        if (status == UserStatus.RESTRICTED) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ErrorCode.ACCOUNT_RESTRICTED,
                    "Account is restricted",
                    false,
                    Map.of()
            );
        }
        if (status == UserStatus.DISABLED) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ErrorCode.ACCOUNT_DISABLED,
                    "Account is disabled",
                    false,
                    Map.of()
            );
        }
    }

    private ApiException invalidCredentials() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                ErrorCode.ACCOUNT_CREDENTIALS_INVALID,
                "Credentials are invalid",
                false,
                Map.of()
        );
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

    private ApiException identifierTaken() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ACCOUNT_IDENTIFIER_TAKEN,
                "Account identifier is unavailable",
                false,
                Map.of()
        );
    }

    private ApiException passwordResetInvalid() {
        return new ApiException(
                HttpStatus.BAD_REQUEST,
                ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
                "Password reset credential is invalid or expired",
                false,
                Map.of()
        );
    }

    private ApiException passwordReuseNotAllowed() {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.PASSWORD_REUSE_NOT_ALLOWED,
                "New password must differ from the current password",
                false,
                Map.of()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Session was not found",
                false,
                Map.of()
        );
    }
}

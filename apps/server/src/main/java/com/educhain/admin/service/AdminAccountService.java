package com.educhain.admin.service;

import com.educhain.auth.entity.AuthCredentialEntity;
import com.educhain.auth.entity.RefreshSessionEntity;
import com.educhain.auth.repository.AuthCredentialRepository;
import com.educhain.auth.repository.RefreshSessionRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.entity.UserAccountEntity;
import com.educhain.user.entity.UserProfileEntity;
import com.educhain.user.entity.UserRoleEntity;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.mapper.UserMapper;
import com.educhain.user.repository.UserAccountRepository;
import com.educhain.user.repository.UserProfileRepository;
import com.educhain.user.repository.UserRoleRepository;
import com.educhain.user.service.GovernanceUserView;
import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAccountService {

    private final UserAccountRepository accounts;
    private final UserProfileRepository profiles;
    private final UserRoleRepository roles;
    private final AuthCredentialRepository credentials;
    private final RefreshSessionRepository sessions;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public AdminAccountService(
            UserAccountRepository accounts,
            UserProfileRepository profiles,
            UserRoleRepository roles,
            AuthCredentialRepository credentials,
            RefreshSessionRepository sessions,
            UserMapper mapper,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.accounts = accounts;
        this.profiles = profiles;
        this.roles = roles;
        this.credentials = credentials;
        this.sessions = sessions;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public GovernanceUserView get(UUID userId) {
        return view(requireAccount(userId));
    }

    @Transactional
    public GovernanceUserView create(
            String email,
            String handle,
            String displayName,
            List<UserRoleName> requestedRoles
    ) {
        String normalizedEmail = normalize(email);
        String normalizedHandle = normalize(handle);
        if (accounts.existsByEmailNormalizedOrHandleNormalized(normalizedEmail, normalizedHandle)) {
            throw identifierTaken();
        }
        UserAccountEntity account = accounts.saveAndFlush(
                new UserAccountEntity(normalizedEmail, normalizedHandle)
        );
        profiles.save(new UserProfileEntity(account.getId(), displayName.trim()));
        roleSet(requestedRoles).forEach(role -> roles.save(
                new UserRoleEntity(account.getId(), role)
        ));
        credentials.save(new AuthCredentialEntity(
                account.getId(),
                passwordEncoder.encode(UUID.randomUUID() + "." + UUID.randomUUID()),
                clock.instant()
        ));
        accounts.flush();
        return view(account);
    }

    @Transactional
    public GovernanceUserView update(
            UUID actorId,
            UUID userId,
            long expectedVersion,
            String email,
            String handle,
            String displayName,
            List<UserRoleName> requestedRoles,
            UserStatus status
    ) {
        UserAccountEntity account = requireAccount(userId);
        validateVersion(account, expectedVersion);
        String normalizedEmail = normalize(email);
        String normalizedHandle = normalize(handle);
        if (accounts.existsByEmailNormalizedAndIdNot(normalizedEmail, userId)
                || accounts.existsByHandleNormalizedAndIdNot(normalizedHandle, userId)) {
            throw identifierTaken();
        }
        Set<UserRoleName> nextRoles = roleSet(requestedRoles);
        protectAdministrator(actorId, account, nextRoles, status);
        account.updateIdentity(normalizedEmail, normalizedHandle);
        account.changeStatus(status);
        UserProfileEntity profile = requireProfile(userId);
        profile.update(
                displayName.trim(),
                profile.getBio(),
                profile.getEducation(),
                profile.getAvatarFileId(),
                profile.getLocation(),
                profile.getWebsiteUrl(),
                profile.getContactEmail()
        );
        roles.deleteAllByUserId(userId);
        roles.flush();
        nextRoles.forEach(role -> roles.save(new UserRoleEntity(userId, role)));
        if (status != UserStatus.ACTIVE) revokeSessions(userId);
        accounts.flush();
        return view(account);
    }

    @Transactional
    public void disable(UUID actorId, UUID userId, long expectedVersion) {
        UserAccountEntity account = requireAccount(userId);
        validateVersion(account, expectedVersion);
        Set<UserRoleName> currentRoles = new LinkedHashSet<>(roleNames(userId));
        protectAdministrator(actorId, account, currentRoles, UserStatus.DISABLED);
        account.changeStatus(UserStatus.DISABLED);
        revokeSessions(userId);
        accounts.flush();
    }

    private void protectAdministrator(
            UUID actorId,
            UserAccountEntity account,
            Set<UserRoleName> nextRoles,
            UserStatus nextStatus
    ) {
        boolean currentlyAdministrator = roles.existsByUserIdAndRoleName(
                account.getId(),
                UserRoleName.ADMINISTRATOR
        );
        boolean removingOwnAccess = actorId.equals(account.getId())
                && (nextStatus != UserStatus.ACTIVE
                || !nextRoles.contains(UserRoleName.ADMINISTRATOR));
        boolean removingLastAdministrator = currentlyAdministrator
                && account.getStatus() == UserStatus.ACTIVE
                && (nextStatus != UserStatus.ACTIVE
                || !nextRoles.contains(UserRoleName.ADMINISTRATOR))
                && accounts.countActiveAdministrators() <= 1;
        if (removingOwnAccess || removingLastAdministrator) throw protectedRole();
    }

    private void revokeSessions(UUID userId) {
        List<RefreshSessionEntity> active = sessions
                .findAllByUserIdAndRevokedAtIsNullAndRotatedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        userId,
                        clock.instant()
                );
        active.forEach(session -> session.revoke(clock.instant()));
    }

    private GovernanceUserView view(UserAccountEntity account) {
        UserProfileEntity profile = requireProfile(account.getId());
        return new GovernanceUserView(
                mapper.toSummary(account, profile),
                account.getEmailNormalized(),
                roleNames(account.getId()),
                account.getCreatedAt()
        );
    }

    private List<UserRoleName> roleNames(UUID userId) {
        return roles.findAllByUserIdOrderByRoleNameAsc(userId)
                .stream()
                .map(UserRoleEntity::getRoleName)
                .toList();
    }

    private Set<UserRoleName> roleSet(List<UserRoleName> requestedRoles) {
        Set<UserRoleName> result = new LinkedHashSet<>(requestedRoles);
        result.add(UserRoleName.USER);
        return result;
    }

    private UserAccountEntity requireAccount(UUID userId) {
        return accounts.findById(userId).orElseThrow(this::notFound);
    }

    private UserProfileEntity requireProfile(UUID userId) {
        return profiles.findById(userId).orElseThrow(this::notFound);
    }

    private void validateVersion(UserAccountEntity account, long expectedVersion) {
        if (account.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Account version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(account.getVersion()))
            );
        }
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
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

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "User was not found",
                false,
                Map.of()
        );
    }

    private ApiException protectedRole() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.ROLE_PROTECTED,
                "The protected administrator account cannot be changed",
                false,
                Map.of()
        );
    }
}

package com.educhain.bootstrap;

import com.educhain.auth.entity.AuthCredentialEntity;
import com.educhain.auth.repository.AuthCredentialRepository;
import com.educhain.platform.security.RuntimeSafetyProperties;
import com.educhain.user.entity.UserAccountEntity;
import com.educhain.user.entity.UserProfileEntity;
import com.educhain.user.entity.UserRoleEntity;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.repository.UserAccountRepository;
import com.educhain.user.repository.UserProfileRepository;
import com.educhain.user.repository.UserRoleRepository;
import java.time.Clock;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(prefix = "educhain.local-bootstrap", name = "enabled", havingValue = "true")
public class LocalAdministratorBootstrap implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocalAdministratorBootstrap.class);
    private static final Pattern HANDLE_PATTERN = Pattern.compile("^[a-z][a-z0-9_-]{2,31}$");

    private final LocalBootstrapProperties properties;
    private final RuntimeSafetyProperties runtimeSafety;
    private final UserAccountRepository accountRepository;
    private final UserProfileRepository profileRepository;
    private final UserRoleRepository roleRepository;
    private final AuthCredentialRepository credentialRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public LocalAdministratorBootstrap(
            LocalBootstrapProperties properties,
            RuntimeSafetyProperties runtimeSafety,
            UserAccountRepository accountRepository,
            UserProfileRepository profileRepository,
            UserRoleRepository roleRepository,
            AuthCredentialRepository credentialRepository,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.properties = properties;
        this.runtimeSafety = runtimeSafety;
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.roleRepository = roleRepository;
        this.credentialRepository = credentialRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (runtimeSafety.environment() != RuntimeSafetyProperties.Environment.LOCAL) {
            throw new IllegalStateException("Local account bootstrap is allowed only in LOCAL mode");
        }

        String email = normalize(properties.adminEmail());
        String handle = normalize(properties.adminHandle());
        String displayName = requireText(properties.adminDisplayName(), "display name");
        String password = requireText(properties.adminPassword(), "password");
        if (!email.contains("@") || email.length() > 254) {
            throw new IllegalStateException("Local administrator email is invalid");
        }
        if (!HANDLE_PATTERN.matcher(handle).matches()) {
            throw new IllegalStateException("Local administrator handle is invalid");
        }
        if (displayName.length() > 80 || password.length() < 12 || password.length() > 128) {
            throw new IllegalStateException("Local administrator bootstrap values are invalid");
        }

        Optional<UserAccountEntity> byEmail = accountRepository.findByEmailNormalized(email);
        Optional<UserAccountEntity> byHandle = accountRepository.findByHandleNormalized(handle);
        if (byEmail.isPresent() && byHandle.isPresent()
                && !byEmail.orElseThrow().getId().equals(byHandle.orElseThrow().getId())) {
            throw new IllegalStateException("Local administrator identifiers belong to different accounts");
        }

        UserAccountEntity account = byEmail.or(() -> byHandle).orElseGet(() -> createAccount(
                email,
                handle,
                displayName
        ));
        if (!account.getEmailNormalized().equals(email)
                || !account.getHandleNormalized().equals(handle)) {
            throw new IllegalStateException("Local administrator identifier collides with an existing account");
        }

        profileRepository.findById(account.getId()).orElseGet(() -> profileRepository.save(
                new UserProfileEntity(account.getId(), displayName)
        ));
        ensureRole(account.getId(), UserRoleName.USER);
        ensureRole(account.getId(), UserRoleName.ADMINISTRATOR);
        if (!credentialRepository.existsById(account.getId())) {
            credentialRepository.save(new AuthCredentialEntity(
                    account.getId(),
                    passwordEncoder.encode(password),
                    clock.instant()
            ));
        }
        LOGGER.info("Local administrator account is ready for handle {}", handle);
    }

    private UserAccountEntity createAccount(String email, String handle, String displayName) {
        UserAccountEntity account = accountRepository.saveAndFlush(new UserAccountEntity(email, handle));
        profileRepository.save(new UserProfileEntity(account.getId(), displayName));
        return account;
    }

    private void ensureRole(UUID userId, UserRoleName role) {
        if (!roleRepository.existsByUserIdAndRoleName(userId, role)) {
            roleRepository.save(new UserRoleEntity(userId, role));
        }
    }

    private String normalize(String value) {
        return requireText(value, "identifier").toLowerCase(Locale.ROOT);
    }

    private String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Local administrator " + label + " is required");
        }
        return value.trim();
    }
}

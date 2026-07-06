package com.educhain.user.service;

import com.educhain.platform.port.SessionRevocationPort;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserGovernanceService {

    private final UserAccountRepository accountRepository;
    private final UserProfileRepository profileRepository;
    private final UserRoleRepository roleRepository;
    private final SessionRevocationPort sessionRevocation;
    private final UserMapper mapper;

    public UserGovernanceService(
            UserAccountRepository accountRepository,
            UserProfileRepository profileRepository,
            UserRoleRepository roleRepository,
            SessionRevocationPort sessionRevocation,
            UserMapper mapper
    ) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.roleRepository = roleRepository;
        this.sessionRevocation = sessionRevocation;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Page<GovernanceUserView> list(String query, UserStatus status, int limit) {
        return accountRepository.searchForGovernance(
                query == null ? "" : query.trim(),
                status,
                PageRequest.of(0, limit)
        ).map(this::view);
    }

    @Transactional
    public GovernanceUserView changeStatus(
            UUID actorId,
            UUID userId,
            long expectedVersion,
            UserStatus status
    ) {
        UserAccountEntity account = accountRepository.findById(userId).orElseThrow(this::notFound);
        if (account.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Account version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(account.getVersion()))
            );
        }
        if (actorId.equals(userId) && status != UserStatus.ACTIVE) throw protectedRole();
        boolean administrator = roleRepository.existsByUserIdAndRoleName(
                userId,
                UserRoleName.ADMINISTRATOR
        );
        if (administrator
                && account.getStatus() == UserStatus.ACTIVE
                && status != UserStatus.ACTIVE
                && accountRepository.countActiveAdministrators() <= 1) {
            throw protectedRole();
        }
        account.changeStatus(status);
        if (status != UserStatus.ACTIVE) {
            sessionRevocation.revokeActiveSessions(userId);
        }
        accountRepository.flush();
        return view(account);
    }

    @Transactional(readOnly = true)
    public long restrictedCount() {
        return accountRepository.countByStatus(UserStatus.RESTRICTED)
                + accountRepository.countByStatus(UserStatus.DISABLED);
    }

    private GovernanceUserView view(UserAccountEntity account) {
        UserProfileEntity profile = profileRepository.findById(account.getId())
                .orElseThrow(this::notFound);
        List<UserRoleName> roles = roleRepository
                .findAllByUserIdOrderByRoleNameAsc(account.getId())
                .stream()
                .map(UserRoleEntity::getRoleName)
                .toList();
        return new GovernanceUserView(
                mapper.toSummary(account, profile),
                account.getEmailNormalized(),
                roles,
                account.getCreatedAt()
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
                "The protected administrator account cannot be restricted",
                false,
                Map.of()
        );
    }
}

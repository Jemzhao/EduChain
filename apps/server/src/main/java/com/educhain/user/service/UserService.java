package com.educhain.user.service;

import com.educhain.platform.contract.FollowStatistics;
import com.educhain.platform.port.KnowledgeStatisticsPort;
import com.educhain.platform.port.SocialStatisticsPort;
import com.educhain.file.domain.UploadPurpose;
import com.educhain.file.service.FileBindingService;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.user.dto.CurrentUserResponse;
import com.educhain.user.dto.ProfileDetailsResponse;
import com.educhain.user.dto.PublicUserResponse;
import com.educhain.user.dto.PublicUserStatisticsResponse;
import com.educhain.user.dto.UpdateProfileRequest;
import com.educhain.user.entity.UserAccountEntity;
import com.educhain.user.entity.UserProfileEntity;
import com.educhain.user.entity.UserRoleEntity;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.mapper.UserMapper;
import com.educhain.user.repository.UserAccountRepository;
import com.educhain.user.repository.UserProfileRepository;
import com.educhain.user.repository.UserRoleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Collection;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserAccountRepository accountRepository;
    private final UserProfileRepository profileRepository;
    private final UserRoleRepository roleRepository;
    private final UserMapper mapper;
    private final EntityManager entityManager;
    private final KnowledgeStatisticsPort knowledgeStatistics;
    private final SocialStatisticsPort socialStatistics;
    private final FileBindingService fileBindingService;

    public UserService(
            UserAccountRepository accountRepository,
            UserProfileRepository profileRepository,
            UserRoleRepository roleRepository,
            UserMapper mapper,
            EntityManager entityManager,
            KnowledgeStatisticsPort knowledgeStatistics,
            SocialStatisticsPort socialStatistics,
            FileBindingService fileBindingService
    ) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.roleRepository = roleRepository;
        this.mapper = mapper;
        this.entityManager = entityManager;
        this.knowledgeStatistics = knowledgeStatistics;
        this.socialStatistics = socialStatistics;
        this.fileBindingService = fileBindingService;
    }

    @Transactional
    public RegisteredAccount register(String email, String handle, String displayName) {
        String normalizedEmail = normalize(email);
        String normalizedHandle = normalize(handle);
        if (accountRepository.existsByEmailNormalizedOrHandleNormalized(
                normalizedEmail,
                normalizedHandle
        )) {
            throw identifierTaken();
        }

        UserAccountEntity account = accountRepository.saveAndFlush(
                new UserAccountEntity(normalizedEmail, normalizedHandle)
        );
        UserProfileEntity profile = profileRepository.save(
                new UserProfileEntity(account.getId(), displayName.trim())
        );
        roleRepository.save(new UserRoleEntity(account.getId(), UserRoleName.USER));
        return new RegisteredAccount(account.getId(), mapper.toSummary(account, profile));
    }

    @Transactional(readOnly = true)
    public Optional<AuthenticationView> findForAuthentication(String identifier) {
        String normalized = normalize(identifier);
        return accountRepository.findByEmailNormalizedOrHandleNormalized(normalized, normalized)
                .map(this::toAuthenticationView);
    }

    @Transactional(readOnly = true)
    public AuthenticationView requireForAuthentication(UUID userId) {
        return toAuthenticationView(requireAccount(userId));
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {
        UserAccountEntity account = requireAccount(userId);
        UserProfileEntity profile = requireProfile(userId);
        return new CurrentUserResponse(
                mapper.toSummary(account, profile),
                account.getEmailNormalized(),
                roles(userId),
                mapper.toProfile(profile)
        );
    }

    @Transactional
    public CurrentUserResponse updateCurrentUser(
            UUID userId,
            long expectedVersion,
            UpdateProfileRequest request
    ) {
        UserAccountEntity account = requireAccount(userId);
        if (account.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Profile version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(account.getVersion()))
            );
        }

        UserProfileEntity profile = requireProfile(userId);
        if (request.avatarFileId() != null) {
            fileBindingService.requireAvailable(
                    userId,
                    request.avatarFileId(),
                    Set.of(UploadPurpose.AVATAR)
            );
        }
        profile.update(
                request.displayName().trim(),
                safeTrim(request.bio()),
                safeTrim(request.education()),
                request.avatarFileId(),
                safeTrim(request.location()),
                safeTrim(request.websiteUrl()),
                safeTrim(request.contactEmail())
        );
        entityManager.lock(account, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
        entityManager.flush();
        return new CurrentUserResponse(
                mapper.toSummary(account, profile),
                account.getEmailNormalized(),
                roles(userId),
                mapper.toProfile(profile)
        );
    }

    @Transactional(readOnly = true)
    public PublicUserResponse getPublicUser(String handle) {
        UserAccountEntity account = accountRepository.findByHandleNormalized(normalize(handle))
                .orElseThrow(this::notFound);
        UserProfileEntity profile = requireProfile(account.getId());
        FollowStatistics followStatistics = socialStatistics.statistics(account.getId());
        return new PublicUserResponse(
                mapper.toSummary(account, profile),
                mapper.toProfile(profile),
                new PublicUserStatisticsResponse(
                        Math.toIntExact(knowledgeStatistics.publishedCount(account.getId())),
                        Math.toIntExact(followStatistics.followers()),
                        Math.toIntExact(followStatistics.following())
                )
        );
    }

    @Transactional(readOnly = true)
    public PublicAuthorSnapshot getPublicAuthor(UUID userId) {
        UserAccountEntity account = requireAccount(userId);
        UserProfileEntity profile = requireProfile(userId);
        return new PublicAuthorSnapshot(
                account.getId(),
                account.getHandleNormalized(),
                profile.getDisplayName(),
                avatarUrl(profile)
        );
    }

    @Transactional(readOnly = true)
    public Map<UUID, PublicAuthorSnapshot> getPublicAuthors(Collection<UUID> userIds) {
        Map<UUID, UserAccountEntity> accounts = new HashMap<>();
        accountRepository.findAllById(userIds)
                .forEach(account -> accounts.put(account.getId(), account));
        Map<UUID, UserProfileEntity> profiles = new HashMap<>();
        profileRepository.findAllById(userIds)
                .forEach(profile -> profiles.put(profile.getUserId(), profile));
        Map<UUID, PublicAuthorSnapshot> result = new HashMap<>();
        for (UUID userId : userIds) {
            UserAccountEntity account = accounts.get(userId);
            UserProfileEntity profile = profiles.get(userId);
            if (account == null || profile == null) {
                throw notFound();
            }
            result.put(userId, new PublicAuthorSnapshot(
                    account.getId(),
                    account.getHandleNormalized(),
                    profile.getDisplayName(),
                    avatarUrl(profile)
            ));
        }
        return Map.copyOf(result);
    }

    @Transactional(readOnly = true)
    public SocialUserSnapshot requireActiveSocialUser(UUID userId) {
        UserAccountEntity account = requireAccount(userId);
        UserProfileEntity profile = requireProfile(userId);
        if (account.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.INTERACTION_TARGET_UNAVAILABLE,
                    "User is not available for interaction",
                    false,
                    Map.of("userId", userId.toString())
            );
        }
        return new SocialUserSnapshot(
                account.getId(),
                account.getHandleNormalized(),
                profile.getDisplayName(),
                avatarUrl(profile),
                account.getStatus()
        );
    }

    private AuthenticationView toAuthenticationView(UserAccountEntity account) {
        UserProfileEntity profile = requireProfile(account.getId());
        return new AuthenticationView(
                account.getId(),
                account.getEmailNormalized(),
                account.getHandleNormalized(),
                account.getStatus(),
                roles(account.getId()),
                mapper.toSummary(account, profile)
        );
    }

    private List<UserRoleName> roles(UUID userId) {
        return roleRepository.findAllByUserIdOrderByRoleNameAsc(userId).stream()
                .map(UserRoleEntity::getRoleName)
                .toList();
    }

    private UserAccountEntity requireAccount(UUID userId) {
        return accountRepository.findById(userId).orElseThrow(this::notFound);
    }

    private UserProfileEntity requireProfile(UUID userId) {
        return profileRepository.findById(userId).orElseThrow(this::notFound);
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String avatarUrl(UserProfileEntity profile) {
        return profile.getAvatarFileId() == null
                ? null
                : "/api/v1/files/" + profile.getAvatarFileId() + "/content";
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
}

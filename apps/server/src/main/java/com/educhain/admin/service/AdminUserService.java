package com.educhain.admin.service;

import com.educhain.admin.dto.AdminModels;
import com.educhain.audit.service.AuditService;
import com.educhain.auth.dto.PasswordResetRequest;
import com.educhain.auth.dto.PasswordResetRequestResponse;
import com.educhain.auth.service.AuthenticationService;
import com.educhain.user.domain.UserStatus;
import com.educhain.user.service.GovernanceUserView;
import com.educhain.user.service.UserGovernanceService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserGovernanceService users;
    private final AdminAccountService accounts;
    private final AuthenticationService authentication;
    private final AuditService audit;
    private final AdminModelMapper mapper;

    public AdminUserService(
            UserGovernanceService users,
            AdminAccountService accounts,
            AuthenticationService authentication,
            AuditService audit,
            AdminModelMapper mapper
    ) {
        this.users = users;
        this.accounts = accounts;
        this.authentication = authentication;
        this.audit = audit;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminModels.UserListResponse userList(String query, UserStatus status, int limit) {
        Page<GovernanceUserView> page = users.list(query, status, limit);
        return new AdminModels.UserListResponse(
                page.map(mapper::user).getContent(),
                mapper.pageInfo(page)
        );
    }

    @Transactional(readOnly = true)
    public AdminModels.UserResponse user(UUID userId) {
        return mapper.user(accounts.get(userId));
    }

    @Transactional
    public AdminModels.UserProvisioningResponse createUser(
            UUID actorId,
            AdminModels.UserCreateRequest request,
            String requestId
    ) {
        GovernanceUserView created = accounts.create(
                request.email(),
                request.handle(),
                request.displayName(),
                request.roles()
        );
        PasswordResetRequestResponse reset = authentication.requestPasswordReset(
                new PasswordResetRequest(created.email())
        );
        audit.succeeded(
                actorId,
                "USER_PROVISIONED",
                "USER",
                created.user().id(),
                request.reason().trim(),
                requestId
        );
        return new AdminModels.UserProvisioningResponse(
                mapper.user(created),
                mapper.passwordReset(reset)
        );
    }

    @Transactional
    public AdminModels.UserResponse updateUser(
            UUID actorId,
            UUID userId,
            long expectedVersion,
            AdminModels.UserUpdateRequest request,
            String requestId
    ) {
        GovernanceUserView updated = accounts.update(
                actorId,
                userId,
                expectedVersion,
                request.email(),
                request.handle(),
                request.displayName(),
                request.roles(),
                request.status()
        );
        audit.succeeded(
                actorId,
                "USER_UPDATED",
                "USER",
                userId,
                request.reason().trim(),
                requestId
        );
        return mapper.user(updated);
    }

    @Transactional
    public void deleteUser(
            UUID actorId,
            UUID userId,
            long expectedVersion,
            String reason,
            String requestId
    ) {
        accounts.disable(actorId, userId, expectedVersion);
        audit.succeeded(actorId, "USER_DISABLED", "USER", userId, reason, requestId);
    }

    @Transactional
    public AdminModels.BatchResultResponse deleteUsers(
            UUID actorId,
            AdminModels.UserDeletionBatchRequest request,
            String requestId
    ) {
        int processed = 0;
        for (UUID userId : request.userIds().stream().distinct().toList()) {
            GovernanceUserView current = accounts.get(userId);
            accounts.disable(actorId, userId, current.user().version());
            audit.succeeded(
                    actorId,
                    "USER_DISABLED",
                    "USER",
                    userId,
                    request.reason().trim(),
                    requestId
            );
            processed += 1;
        }
        return new AdminModels.BatchResultResponse(processed);
    }

    @Transactional
    public AdminModels.PasswordResetResponse requestPasswordReset(
            UUID actorId,
            UUID userId,
            String reason,
            String requestId
    ) {
        GovernanceUserView user = accounts.get(userId);
        PasswordResetRequestResponse response = authentication.requestPasswordReset(
                new PasswordResetRequest(user.email())
        );
        audit.succeeded(
                actorId,
                "PASSWORD_RESET_REQUESTED",
                "USER",
                userId,
                reason,
                requestId
        );
        return mapper.passwordReset(response);
    }

    @Transactional
    public AdminModels.UserResponse changeUserStatus(
            UUID actorId,
            UUID userId,
            long expectedVersion,
            AdminModels.UserStatusRequest request,
            String requestId
    ) {
        GovernanceUserView view = users.changeStatus(
                actorId,
                userId,
                expectedVersion,
                request.status()
        );
        audit.succeeded(
                actorId,
                "USER_STATUS_CHANGED",
                "USER",
                userId,
                request.reason().trim(),
                requestId
        );
        return mapper.user(view);
    }

    @Transactional
    public String exportUsers(UUID actorId, String reason, String requestId) {
        StringBuilder csv = new StringBuilder("id,handle,display_name,email,status,roles,created_at\n");
        users.list("", null, 50).forEach(view -> csv.append(mapper.csv(view.user().id().toString()))
                .append(',').append(mapper.csv(view.user().handle()))
                .append(',').append(mapper.csv(view.user().displayName()))
                .append(',').append(mapper.csv(view.email()))
                .append(',').append(mapper.csv(view.user().status().name()))
                .append(',').append(mapper.csv(view.roles().toString()))
                .append(',').append(mapper.csv(view.createdAt().toString()))
                .append('\n'));
        audit.succeeded(actorId, "USERS_EXPORTED", "USER_EXPORT", UUID.randomUUID(), reason, requestId);
        return csv.toString();
    }
}

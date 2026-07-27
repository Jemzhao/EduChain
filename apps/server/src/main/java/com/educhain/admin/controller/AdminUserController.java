package com.educhain.admin.controller;

import com.educhain.admin.dto.AdminModels;
import com.educhain.admin.service.AdminUserService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
import com.educhain.user.domain.UserStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('MODERATOR', 'ADMINISTRATOR')")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.UserListResponse users(
            @RequestParam(required = false) @Size(max = 120) String query,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.userList(query, status, limit);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.UserProvisioningResponse createUser(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.UserCreateRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.createUser(principal.userId(), request, requestId);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.UserResponse user(@PathVariable UUID userId) {
        return service.user(userId);
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.UserResponse updateUser(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.UserUpdateRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.updateUser(
                principal.userId(),
                userId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public void deleteUser(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        service.deleteUser(
                principal.userId(),
                userId,
                EntityTagVersions.parse(ifMatch),
                request.reason().trim(),
                requestId
        );
    }

    @PostMapping("/user-deletion-batches")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.BatchResultResponse deleteUsers(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.UserDeletionBatchRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.deleteUsers(principal.userId(), request, requestId);
    }

    @PostMapping("/users/{userId}/password-reset-requests")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.PasswordResetResponse requestPasswordReset(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.requestPasswordReset(
                principal.userId(),
                userId,
                request.reason().trim(),
                requestId
        );
    }

    @PutMapping("/users/{userId}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AdminModels.UserResponse changeUserStatus(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID userId,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody AdminModels.UserStatusRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.changeUserStatus(
                principal.userId(),
                userId,
                EntityTagVersions.parse(ifMatch),
                request,
                requestId
        );
    }

    @PostMapping(value = "/user-exports", produces = "text/csv")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public String exportUsers(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody AdminModels.GovernanceReasonRequest request,
            @RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId
    ) {
        return service.exportUsers(principal.userId(), request.reason().trim(), requestId);
    }
}

package com.educhain.user.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.http.EntityTagVersions;
import com.educhain.user.dto.CurrentUserResponse;
import com.educhain.user.dto.PublicUserResponse;
import com.educhain.user.dto.UpdateProfileRequest;
import com.educhain.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public CurrentUserResponse currentUser(@AuthenticationPrincipal EduChainPrincipal principal) {
        return userService.getCurrentUser(principal.userId());
    }

    @PatchMapping("/me")
    public ResponseEntity<CurrentUserResponse> updateCurrentUser(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        CurrentUserResponse response = userService.updateCurrentUser(
                principal.userId(),
                EntityTagVersions.parse(ifMatch),
                request
        );
        return ResponseEntity.ok()
                .eTag(Long.toString(response.user().version()))
                .body(response);
    }

    @GetMapping("/{handle}")
    public PublicUserResponse publicUser(
            @PathVariable
            @Pattern(regexp = "^[a-z][a-z0-9_-]{2,31}$") String handle
    ) {
        return userService.getPublicUser(handle);
    }
}

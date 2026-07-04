package com.educhain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetCompletionRequest(
        @NotBlank @Size(min = 32, max = 256) String token,
        @NotBlank @Size(min = 12, max = 128) String newPassword
) {
}

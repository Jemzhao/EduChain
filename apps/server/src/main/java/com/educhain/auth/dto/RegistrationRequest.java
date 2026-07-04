package com.educhain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Pattern(regexp = "^[a-z][a-z0-9_-]{2,31}$") String handle,
        @NotBlank @Size(min = 12, max = 128) String password,
        @NotBlank @Size(max = 80) String displayName
) {
}

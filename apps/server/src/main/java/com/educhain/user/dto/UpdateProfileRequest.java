package com.educhain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 80) String displayName,
        @Size(max = 500) String bio,
        @Size(max = 160) String education,
        UUID avatarFileId,
        @Size(max = 120) String location,
        @Size(max = 300) @Pattern(regexp = "^$|https://.+") String websiteUrl,
        @Size(max = 254) @Email String contactEmail
) {
}

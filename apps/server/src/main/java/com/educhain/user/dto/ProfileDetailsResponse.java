package com.educhain.user.dto;

public record ProfileDetailsResponse(
        String bio,
        String education,
        String location,
        String websiteUrl,
        String contactEmail
) {
}

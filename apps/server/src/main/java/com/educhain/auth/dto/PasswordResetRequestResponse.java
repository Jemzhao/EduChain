package com.educhain.auth.dto;

public record PasswordResetRequestResponse(boolean accepted, String previewToken) {
}

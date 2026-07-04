package com.educhain.auth.dto;

public record CsrfTokenResponse(String token, String headerName) {
}

import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken, invalidateCsrfToken } from "@/data-access/http/csrf";
import { ensureApiSuccess, unwrapApiResult } from "@/data-access/http/result";

type RegistrationRequest = components["schemas"]["RegistrationRequest"];
type LoginRequest = components["schemas"]["LoginRequest"];
type PasswordResetRequest = components["schemas"]["PasswordResetRequest"];
type PasswordResetCompletionRequest = components["schemas"]["PasswordResetCompletionRequest"];
type PasswordChangeRequest = components["schemas"]["PasswordChangeRequest"];

export async function registerAccount(body: RegistrationRequest) {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.POST("/auth/registrations", {
    body,
    params: { header: { "Idempotency-Key": crypto.randomUUID() } },
    headers: {
      "X-XSRF-TOKEN": csrfToken,
    },
  });
  return unwrapApiResult(result);
}

export async function createSession(body: LoginRequest) {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.POST("/auth/sessions", {
    body,
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  return unwrapApiResult(result);
}

export async function deleteCurrentSession(): Promise<void> {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.DELETE("/auth/sessions/current", {
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  ensureApiSuccess(result);
  invalidateCsrfToken();
}

export async function getSessions() {
  return unwrapApiResult(await apiClient.GET("/auth/sessions"));
}

export async function deleteSession(sessionId: string): Promise<void> {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.DELETE("/auth/sessions/{sessionId}", {
    params: { path: { sessionId } },
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  ensureApiSuccess(result);
}

export async function requestPasswordReset(body: PasswordResetRequest) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/auth/password-reset-requests", {
      body,
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function completePasswordReset(body: PasswordResetCompletionRequest): Promise<void> {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.POST("/auth/password-resets", {
    body,
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  ensureApiSuccess(result);
  invalidateCsrfToken();
}

export async function changePassword(body: PasswordChangeRequest): Promise<void> {
  const csrfToken = await getCsrfToken();
  const result = await apiClient.POST("/auth/password-changes", {
    body,
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  ensureApiSuccess(result);
  invalidateCsrfToken();
}

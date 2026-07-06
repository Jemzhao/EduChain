import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { unwrapApiResult } from "@/data-access/http/result";

type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];

export async function getCurrentUser() {
  const result = await apiClient.GET("/auth/sessions/current");
  if (result.response.status === 204) {
    return null;
  }
  return unwrapApiResult(result);
}

export async function getPublicUser(handle: string) {
  return unwrapApiResult(await apiClient.GET("/users/{handle}", { params: { path: { handle } } }));
}

export async function updateCurrentUser(body: UpdateProfileRequest, version: number) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.PATCH("/users/me", {
      body,
      params: { header: { "If-Match": `"${version}"` } },
      headers: {
        "X-XSRF-TOKEN": csrfToken,
      },
    }),
  );
}

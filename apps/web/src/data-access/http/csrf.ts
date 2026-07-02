import { apiClient } from "./client";
import { unwrapApiResult } from "./result";

let csrfTokenPromise: Promise<string> | undefined;

function readCsrfCookie(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = "XSRF-TOKEN=";
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

export function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    const pendingRequest = apiClient.GET("/auth/csrf-token").then((result) => {
      const response = unwrapApiResult(result);
      const cookieToken = readCsrfCookie();
      return cookieToken ?? response.token;
    });

    csrfTokenPromise = pendingRequest;
    void pendingRequest.catch(() => {
      if (csrfTokenPromise === pendingRequest) {
        csrfTokenPromise = undefined;
      }
    });
  }

  return csrfTokenPromise;
}

export function invalidateCsrfToken(): void {
  csrfTokenPromise = undefined;
}

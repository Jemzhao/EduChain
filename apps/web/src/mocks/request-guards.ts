import { problemResponse } from "@/mocks/problem";
import { authState } from "@/mocks/state/auth";

export const pathOf = (request: Request) => new URL(request.url).pathname;

export const requireAuth = (request: Request) => {
  if (authState.current()) return undefined;
  return problemResponse({
    status: 401,
    code: "AUTHENTICATION_REQUIRED",
    path: pathOf(request),
  });
};

export const requireWriteAccess = (request: Request) => {
  const authentication = requireAuth(request);
  if (authentication) return authentication;
  if (request.headers.get("X-XSRF-TOKEN")) return undefined;
  return problemResponse({ status: 403, code: "ACCESS_DENIED", path: pathOf(request) });
};

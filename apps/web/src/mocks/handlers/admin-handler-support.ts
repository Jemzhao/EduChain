import { problemResponse } from "@/mocks/problem";
import { pathOf, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";

export const requireGovernance = (request: Request, administrator = false) => {
  const current = authState.current();
  if (!current) {
    return problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path: pathOf(request) });
  }
  const allowed = administrator
    ? current.roles.includes("ADMINISTRATOR")
    : current.roles.some((role) => role === "ADMINISTRATOR" || role === "MODERATOR");
  return allowed
    ? undefined
    : problemResponse({ status: 403, code: "ACCESS_DENIED", path: pathOf(request) });
};

export const requireGovernanceWrite = (request: Request, administrator = false) =>
  requireGovernance(request, administrator) ?? requireWriteAccess(request);

export const quotedVersion = (request: Request) => {
  const match = request.headers.get("If-Match")?.match(/^"(\d+)"$/);
  return match ? Number(match[1]) : undefined;
};

export const reasonValid = (reason: string) =>
  reason.trim().length >= 10 && reason.trim().length <= 500;

export const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

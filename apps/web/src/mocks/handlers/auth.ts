import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { publicEnvironment } from "@/lib/env/public";
import { problemResponse } from "@/mocks/problem";
import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { resourceState } from "@/mocks/state/resources";
import { fileState } from "@/mocks/state/files";

type RegistrationRequest = components["schemas"]["RegistrationRequest"];
type LoginRequest = components["schemas"]["LoginRequest"];
type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];
type AuthenticatedUser = components["schemas"]["AuthenticatedUserResponse"];
type PasswordResetRequest = components["schemas"]["PasswordResetRequest"];
type PasswordResetCompletionRequest = components["schemas"]["PasswordResetCompletionRequest"];
type PasswordChangeRequest = components["schemas"]["PasswordChangeRequest"];
type SessionSummary = components["schemas"]["SessionSummary"];

type RegistrationReplay = {
  digest: string;
  response: AuthenticatedUser;
};

const registrationReplays = new Map<string, RegistrationReplay>();
const resetTokens = new Map<string, string>();

export function issueMockPasswordResetToken(userId: string) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  resetTokens.set(token, userId);
  return token;
}
let sessions: SessionSummary[] = [
  {
    id: "7e19168c-9ae2-49ce-8a96-73b6d695df68",
    current: true,
    deviceLabel: "Mock browser",
    createdAt: mockBeforeHours(3),
    expiresAt: mockProjectPeriod.end,
  },
  {
    id: "5fc7bfb5-52d2-41d0-ae67-914e724595d5",
    current: false,
    deviceLabel: "Tablet · Safari",
    createdAt: mockBeforeHours(48),
    expiresAt: mockProjectPeriod.end,
  },
];

const digestRegistration = (body: RegistrationRequest) =>
  JSON.stringify({
    ...body,
    email: body.email.trim().toLowerCase(),
    handle: body.handle.trim().toLowerCase(),
    displayName: body.displayName.trim(),
  });

export const authHandlers = [
  http.get("*/api/v1/auth/csrf-token", async () => {
    await delay(80);
    return HttpResponse.json({
      token: `mock-${crypto.randomUUID()}`,
      headerName: "X-XSRF-TOKEN" as const,
    });
  }),

  http.post("*/api/v1/auth/registrations", async ({ request }) => {
    await delay(220);
    const body = (await request.json()) as RegistrationRequest;
    const path = new URL(request.url).pathname;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.length < 16) {
      return problemResponse({ status: 422, code: "FIELD_VALIDATION_FAILED", path });
    }

    const digest = digestRegistration(body);
    const replay = registrationReplays.get(idempotencyKey);
    if (replay) {
      if (replay.digest !== digest) {
        return problemResponse({ status: 409, code: "IDEMPOTENCY_CONFLICT", path });
      }
      return HttpResponse.json(replay.response, { status: 201 });
    }

    const email = body.email.trim().toLowerCase();
    const handle = body.handle.trim().toLowerCase();
    if (authState.identifierTaken(email, handle)) {
      return problemResponse({ status: 409, code: "ACCOUNT_IDENTIFIER_TAKEN", path });
    }

    const currentUser = authState.register({
      currentUser: {
        user: {
          id: crypto.randomUUID(),
          handle,
          displayName: body.displayName.trim(),
          avatarUrl: null,
          status: "ACTIVE",
          version: 0,
        },
        email,
        roles: ["USER"],
        profile: {
          bio: "",
          education: "",
          location: "",
          websiteUrl: "",
          contactEmail: "",
        },
      },
      password: body.password,
    });
    const response: AuthenticatedUser = { user: currentUser.user };
    registrationReplays.set(idempotencyKey, { digest, response });
    return HttpResponse.json(response, { status: 201 });
  }),

  http.post("*/api/v1/auth/sessions", async ({ request }) => {
    await delay(220);
    const body = (await request.json()) as LoginRequest;
    const path = new URL(request.url).pathname;
    const account = authState.find(body.identifier);
    if (!account || account.password !== body.password) {
      return problemResponse({ status: 401, code: "ACCOUNT_CREDENTIALS_INVALID", path });
    }
    if (account.currentUser.user.status === "RESTRICTED") {
      return problemResponse({ status: 403, code: "ACCOUNT_RESTRICTED", path });
    }
    if (account.currentUser.user.status === "DISABLED") {
      return problemResponse({ status: 403, code: "ACCOUNT_DISABLED", path });
    }

    const currentUser = authState.login(account);
    return HttpResponse.json({ user: currentUser.user });
  }),

  http.get("*/api/v1/auth/sessions", async ({ request }) => {
    await delay(100);
    if (!authState.current()) {
      return problemResponse({
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        path: new URL(request.url).pathname,
      });
    }
    return HttpResponse.json({ items: sessions });
  }),

  http.get("*/api/v1/auth/sessions/current", async () => {
    await delay(80);
    const currentUser = authState.current();
    return currentUser
      ? HttpResponse.json(currentUser, {
          headers: { "Cache-Control": "private, no-store" },
        })
      : new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/api/v1/auth/sessions/current", async ({ request }) => {
    await delay(100);
    if (!authState.current()) {
      return problemResponse({
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        path: new URL(request.url).pathname,
      });
    }
    authState.logout();
    sessions = sessions.filter((session) => !session.current);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/api/v1/auth/sessions/:sessionId", async ({ params, request }) => {
    await delay(100);
    if (!authState.current()) {
      return problemResponse({
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        path: new URL(request.url).pathname,
      });
    }
    const sessionId = String(params.sessionId);
    const found = sessions.some((session) => session.id === sessionId);
    if (!found) {
      return problemResponse({
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        path: new URL(request.url).pathname,
      });
    }
    const current = sessions.find((session) => session.id === sessionId)?.current;
    sessions = sessions.filter((session) => session.id !== sessionId);
    if (current) authState.logout();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/v1/auth/token-refreshes", async ({ request }) => {
    await delay(90);
    return authState.current()
      ? new HttpResponse(null, { status: 204 })
      : problemResponse({
          status: 401,
          code: "AUTHENTICATION_REQUIRED",
          path: new URL(request.url).pathname,
        });
  }),

  http.post("*/api/v1/auth/password-reset-requests", async ({ request }) => {
    await delay(180);
    const body = (await request.json()) as PasswordResetRequest;
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const account = authState.find(body.email);
    if (account) resetTokens.set(token, account.currentUser.user.id);
    return HttpResponse.json({ accepted: true as const, previewToken: token }, { status: 202 });
  }),

  http.post("*/api/v1/auth/password-resets", async ({ request }) => {
    await delay(180);
    const body = (await request.json()) as PasswordResetCompletionRequest;
    const userId = resetTokens.get(body.token);
    const path = new URL(request.url).pathname;
    if (!userId) {
      return problemResponse({ status: 400, code: "PASSWORD_RESET_TOKEN_INVALID", path });
    }
    const result = authState.resetPassword(userId, body.newPassword);
    if (result === "reused") {
      return problemResponse({ status: 422, code: "PASSWORD_REUSE_NOT_ALLOWED", path });
    }
    if (result === "invalid") {
      return problemResponse({ status: 400, code: "PASSWORD_RESET_TOKEN_INVALID", path });
    }
    resetTokens.delete(body.token);
    sessions = [];
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/v1/auth/password-changes", async ({ request }) => {
    await delay(180);
    const body = (await request.json()) as PasswordChangeRequest;
    const current = authState.current();
    const path = new URL(request.url).pathname;
    if (!current) {
      return problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path });
    }
    const result = authState.changePassword(
      current.user.id,
      body.currentPassword,
      body.newPassword,
    );
    if (result === "invalid") {
      return problemResponse({ status: 401, code: "ACCOUNT_CREDENTIALS_INVALID", path });
    }
    if (result === "reused") {
      return problemResponse({ status: 422, code: "PASSWORD_REUSE_NOT_ALLOWED", path });
    }
    sessions = [];
    return new HttpResponse(null, { status: 204 });
  }),
];

export const userHandlers = [
  http.get("*/api/v1/users/me", async ({ request }) => {
    await delay(140);
    const currentUser = authState.current();
    if (!currentUser) {
      return problemResponse({
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        path: new URL(request.url).pathname,
      });
    }
    return HttpResponse.json(currentUser);
  }),

  http.patch("*/api/v1/users/me", async ({ request }) => {
    await delay(180);
    const path = new URL(request.url).pathname;
    const currentUser = authState.current();
    if (!currentUser) {
      return problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path });
    }

    const versionMatch = request.headers.get("If-Match")?.match(/^"(\d+)"$/);
    if (!versionMatch || Number(versionMatch[1]) !== currentUser.user.version) {
      return problemResponse({
        status: 409,
        code: "VERSION_CONFLICT",
        path,
        parameters: { currentVersion: String(currentUser.user.version) },
      });
    }

    const body = (await request.json()) as UpdateProfileRequest;
    if (body.avatarFileId && fileState.getByFileId(body.avatarFileId)?.status !== "AVAILABLE") {
      return problemResponse({ status: 409, code: "UPLOAD_NOT_READY", path });
    }
    const updated = {
      ...currentUser,
      user: {
        ...currentUser.user,
        displayName: body.displayName?.trim() ?? currentUser.user.displayName,
        avatarUrl: body.avatarFileId
          ? `${publicEnvironment.apiBaseUrl}/files/${body.avatarFileId}/content`
          : null,
        version: currentUser.user.version + 1,
      },
      profile: {
        bio: body.bio?.trim() ?? currentUser.profile.bio,
        education: body.education?.trim() ?? currentUser.profile.education,
        location: body.location.trim(),
        websiteUrl: body.websiteUrl.trim(),
        contactEmail: body.contactEmail.trim(),
      },
    };
    return HttpResponse.json(authState.update(updated));
  }),

  http.get("*/api/v1/users/:handle", async ({ params, request }) => {
    await delay(120);
    const account = authState.find(String(params.handle));
    if (!account) {
      return problemResponse({
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        path: new URL(request.url).pathname,
      });
    }
    const statistics = communityState.followCounts(account.currentUser.user.id);
    return HttpResponse.json({
      user: account.currentUser.user,
      profile: account.currentUser.profile,
      statistics: {
        publishedResources: resourceState
          .list()
          .filter((resource) => resource.author.id === account.currentUser.user.id).length,
        ...statistics,
      },
    });
  }),
];
import { mockBeforeHours, mockProjectPeriod } from "@/mocks/clock";

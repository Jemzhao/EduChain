import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";
import { problemResponse } from "@/mocks/problem";
import { pathOf } from "@/mocks/request-guards";
import { adminState } from "@/mocks/state/admin";
import { authState } from "@/mocks/state/auth";
import { issueMockPasswordResetToken } from "./auth";
import {
  quotedVersion,
  reasonValid,
  requireGovernance,
  requireGovernanceWrite,
} from "./admin-handler-support";

type GovernanceReason = components["schemas"]["GovernanceReasonRequest"];
type UserStatusRequest = components["schemas"]["AdminUserStatusRequest"];
type UpdatePlatformSettingRequest = components["schemas"]["UpdatePlatformSettingRequest"];
type UserCreateRequest = components["schemas"]["AdminUserCreateRequest"];
type UserUpdateRequest = components["schemas"]["AdminUserUpdateRequest"];
type UserDeletionBatchRequest = components["schemas"]["AdminUserDeletionBatchRequest"];

export const adminPlatformHandlers = [
  http.get("*/api/v1/admin/overview", async ({ request }) => {
    await delay(110);
    const access = requireGovernance(request);
    return access ?? HttpResponse.json(adminState.overview());
  }),

  http.get("*/api/v1/admin/statistics", async ({ request }) => {
    await delay(120);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.statistics());
  }),

  http.post("*/api/v1/admin/statistics/exports", async ({ request }) => {
    await delay(140);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const data = adminState.statistics();
    const rows = [
      "section,key,value",
      `total,users,${data.users}`,
      `total,published_resources,${data.publishedResources}`,
      ...data.categories.map((item) => `category,"${item.key}",${item.count}`),
      ...data.tags.map((item) => `tag,"${item.key}",${item.count}`),
    ];
    adminState.audit("STATISTICS_EXPORTED", "PLATFORM_STATISTICS", "aggregate", body.reason);
    return new HttpResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv;charset=UTF-8",
        "Content-Disposition": "attachment; filename=educhain-statistics.csv",
      },
    });
  }),

  http.get("*/api/v1/admin/settings", async ({ request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.settings());
  }),

  http.put("*/api/v1/admin/settings/:settingKey", async ({ params, request }) => {
    await delay(150);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as UpdatePlatformSettingRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const key = String(params.settingKey);
    const current = adminState.settings().items.find((item) => item.key === key);
    if (!current)
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    if (quotedVersion(request) !== current.version) {
      return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
    }
    if (current.type === "BOOLEAN" && !["true", "false"].includes(body.value.trim())) {
      return problemResponse({
        status: 422,
        code: "FIELD_VALIDATION_FAILED",
        path: pathOf(request),
      });
    }
    const updated = adminState.updateSetting(key, current.version, body.value)!;
    adminState.audit("PLATFORM_SETTING_UPDATED", "PLATFORM_SETTING", key, body.reason.trim());
    return HttpResponse.json(updated);
  }),

  http.get("*/api/v1/admin/users", async ({ request }) => {
    await delay(130);
    const access = requireGovernance(request, true);
    if (access) return access;
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as components["schemas"]["UserStatus"] | null;
    return HttpResponse.json(
      adminState.users(url.searchParams.get("query") ?? "", status ?? undefined),
    );
  }),

  http.post("*/api/v1/admin/users", async ({ request }) => {
    await delay(180);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as UserCreateRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const email = body.email.trim().toLowerCase();
    const handle = body.handle.trim().toLowerCase();
    if (authState.identifierTaken(email, handle)) {
      return problemResponse({
        status: 409,
        code: "ACCOUNT_IDENTIFIER_TAKEN",
        path: pathOf(request),
      });
    }
    const user = adminState.provisionUser({ ...body, email, handle });
    const previewToken = issueMockPasswordResetToken(user.user.id);
    adminState.audit("USER_PROVISIONED", "USER", user.user.id, body.reason.trim());
    return HttpResponse.json(
      { user, passwordSetup: { accepted: true, previewToken } },
      { status: 201 },
    );
  }),

  http.get("*/api/v1/admin/users/:userId", async ({ params, request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    if (access) return access;
    const user = adminState.users().items.find((item) => item.user.id === String(params.userId));
    return user
      ? HttpResponse.json(user)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.put("*/api/v1/admin/users/:userId", async ({ params, request }) => {
    await delay(180);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const userId = String(params.userId);
    const body = (await request.json()) as UserUpdateRequest;
    const current = authState.findById(userId)?.currentUser;
    if (!current) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    if (quotedVersion(request) !== current.user.version) {
      return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
    }
    if (
      current.user.id === authState.current()!.user.id &&
      (body.status !== "ACTIVE" || !body.roles.includes("ADMINISTRATOR"))
    ) {
      return problemResponse({ status: 409, code: "ROLE_PROTECTED", path: pathOf(request) });
    }
    if (
      authState.identifierTakenByOther(
        body.email.trim().toLowerCase(),
        body.handle.trim().toLowerCase(),
        userId,
      )
    ) {
      return problemResponse({
        status: 409,
        code: "ACCOUNT_IDENTIFIER_TAKEN",
        path: pathOf(request),
      });
    }
    const updated = adminState.replaceUser(userId, body)!;
    adminState.audit("USER_UPDATED", "USER", userId, body.reason.trim());
    return HttpResponse.json(updated);
  }),

  http.delete("*/api/v1/admin/users/:userId", async ({ params, request }) => {
    await delay(160);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    const userId = String(params.userId);
    const current = authState.findById(userId)?.currentUser;
    if (!current) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    if (quotedVersion(request) !== current.user.version) {
      return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
    }
    if (userId === authState.current()!.user.id) {
      return problemResponse({ status: 409, code: "ROLE_PROTECTED", path: pathOf(request) });
    }
    adminState.updateUser(userId, "DISABLED");
    adminState.audit("USER_DISABLED", "USER", userId, body.reason.trim());
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/v1/admin/user-deletion-batches", async ({ request }) => {
    await delay(190);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as UserDeletionBatchRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    if (body.userIds.includes(authState.current()!.user.id)) {
      return problemResponse({ status: 409, code: "ROLE_PROTECTED", path: pathOf(request) });
    }
    let processedCount = 0;
    body.userIds.forEach((userId) => {
      if (adminState.updateUser(userId, "DISABLED")) {
        processedCount += 1;
        adminState.audit("USER_DISABLED", "USER", userId, body.reason.trim());
      }
    });
    return HttpResponse.json({ processedCount });
  }),

  http.post("*/api/v1/admin/users/:userId/password-reset-requests", async ({ params, request }) => {
    await delay(160);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    const userId = String(params.userId);
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    if (!authState.findById(userId)) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    const previewToken = issueMockPasswordResetToken(userId);
    adminState.audit("PASSWORD_RESET_REQUESTED", "USER", userId, body.reason.trim());
    return HttpResponse.json({ accepted: true, previewToken }, { status: 202 });
  }),

  http.put("*/api/v1/admin/users/:userId/status", async ({ params, request }) => {
    await delay(180);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as UserStatusRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const current = authState.findById(String(params.userId))?.currentUser;
    if (!current) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    if (quotedVersion(request) !== current.user.version) {
      return problemResponse({
        status: 409,
        code: "VERSION_CONFLICT",
        path: pathOf(request),
        parameters: { currentVersion: String(current.user.version) },
      });
    }
    if (current.user.id === authState.current()!.user.id && body.status !== "ACTIVE") {
      return problemResponse({ status: 409, code: "ROLE_PROTECTED", path: pathOf(request) });
    }
    adminState.updateUser(current.user.id, body.status);
    adminState.audit("USER_STATUS_CHANGED", "USER", current.user.id, body.reason.trim());
    return HttpResponse.json(
      adminState.users().items.find((item) => item.user.id === current.user.id)!,
    );
  }),
];

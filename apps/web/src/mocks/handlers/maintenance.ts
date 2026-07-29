import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { maintenanceState } from "@/mocks/state/maintenance";

type MaintenanceJobRequest = components["schemas"]["MaintenanceJobRequest"];

function requireAdministrator(request: Request, write = false) {
  const current = authState.current();
  if (!current) {
    return problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path: pathOf(request) });
  }
  if (!current.roles.includes("ADMINISTRATOR")) {
    return problemResponse({ status: 403, code: "ACCESS_DENIED", path: pathOf(request) });
  }
  return write ? requireWriteAccess(request) : undefined;
}

export const maintenanceHandlers = [
  http.get("*/api/v1/admin/maintenance-jobs", async ({ request }) => {
    await delay(100);
    const access = requireAdministrator(request);
    if (access) return access;
    const limit = Math.min(
      50,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 30)),
    );
    return HttpResponse.json(maintenanceState.list(limit));
  }),
  http.post("*/api/v1/admin/maintenance-jobs", async ({ request }) => {
    await delay(160);
    const access = requireAdministrator(request, true);
    if (access) return access;
    const body = (await request.json()) as MaintenanceJobRequest;
    const hasAnnouncementPayload = Boolean(
      body.announcementTitle?.trim() || body.announcementBody?.trim(),
    );
    const validAnnouncement = Boolean(
      body.announcementTitle?.trim() && (body.announcementBody?.trim().length ?? 0) >= 10,
    );
    const valid =
      body.reason.trim().length >= 10 &&
      body.reason.trim().length <= 500 &&
      ((body.type === "SYSTEM_ANNOUNCEMENT" && validAnnouncement) ||
        (body.type !== "SYSTEM_ANNOUNCEMENT" && !hasAnnouncementPayload));
    if (!valid) {
      return problemResponse({
        status: 422,
        code: "FIELD_VALIDATION_FAILED",
        path: pathOf(request),
      });
    }
    return HttpResponse.json(maintenanceState.request(authState.current()!.user.id, body), {
      status: 202,
    });
  }),
];

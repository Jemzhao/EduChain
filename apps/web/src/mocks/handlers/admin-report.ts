import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";
import { problemResponse } from "@/mocks/problem";
import { pathOf, requireWriteAccess } from "@/mocks/request-guards";
import { adminState } from "@/mocks/state/admin";
import { authState } from "@/mocks/state/auth";
import { mockNow } from "@/mocks/clock";

type CreateReportRequest = components["schemas"]["CreateReportRequest"];

export const adminReportHandlers = [
  http.post("*/api/v1/reports", async ({ request }) => {
    await delay(140);
    const access = requireWriteAccess(request);
    if (access) return access;
    const current = authState.current()!;
    const body = (await request.json()) as CreateReportRequest;
    const existing = adminState
      .reports("OPEN")
      .items.some(
        (item) =>
          item.reporterId === current.user.id &&
          item.targetType === body.targetType &&
          item.targetId === body.targetId,
      );
    if (existing) {
      return problemResponse({ status: 409, code: "REPORT_ALREADY_OPEN", path: pathOf(request) });
    }
    return HttpResponse.json(
      adminState.createReport({
        id: crypto.randomUUID(),
        reporterId: current.user.id,
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
        details: body.details?.trim() ?? "",
        status: "OPEN",
        resolution: null,
        resolvedBy: null,
        createdAt: mockNow(),
        updatedAt: mockNow(),
      }),
      { status: 201 },
    );
  }),
];

import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";
import { problemResponse } from "@/mocks/problem";
import { pathOf } from "@/mocks/request-guards";
import { adminState } from "@/mocks/state/admin";
import {
  csvCell,
  reasonValid,
  requireGovernance,
  requireGovernanceWrite,
} from "./admin-handler-support";

type GovernanceReason = components["schemas"]["GovernanceReasonRequest"];
type ReportResolution = components["schemas"]["AdminReportResolutionRequest"];
type ResourceReviewBatchRequest = components["schemas"]["AdminResourceReviewBatchRequest"];

export const adminContentHandlers = [
  http.get("*/api/v1/admin/resources", async ({ request }) => {
    await delay(130);
    const access = requireGovernance(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as
      components["schemas"]["ResourceStatus"] | null;
    return HttpResponse.json(adminState.resources(status ?? undefined));
  }),

  http.post("*/api/v1/admin/resource-review-batches", async ({ request }) => {
    await delay(190);
    const access = requireGovernanceWrite(request);
    if (access) return access;
    const body = (await request.json()) as ResourceReviewBatchRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const response = adminState.reviewResources(body.resourceIds, body.decision);
    body.resourceIds.forEach((resourceId) =>
      adminState.audit(
        body.decision === "APPROVE" ? "RESOURCE_RESTORED" : "RESOURCE_WITHDRAWN",
        "RESOURCE",
        resourceId,
        body.reason.trim(),
      ),
    );
    return HttpResponse.json(response);
  }),

  http.post("*/api/v1/admin/user-exports", async ({ request }) => {
    await delay(150);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const rows = [
      "id,handle,display_name,email,status,roles,created_at",
      ...adminState
        .users()
        .items.map((item) =>
          [
            item.user.id,
            item.user.handle,
            item.user.displayName,
            item.email,
            item.user.status,
            item.roles.join("|"),
            item.createdAt,
          ]
            .map(csvCell)
            .join(","),
        ),
    ];
    adminState.audit("USERS_EXPORTED", "USER_EXPORT", crypto.randomUUID(), body.reason.trim());
    return new HttpResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv;charset=UTF-8",
        "Content-Disposition": "attachment; filename=educhain-users.csv",
      },
    });
  }),

  http.post("*/api/v1/admin/resource-exports", async ({ request }) => {
    await delay(150);
    const access = requireGovernanceWrite(request);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const rows = [
      "id,slug,title,author_handle,status,evidence_status,published_at",
      ...adminState
        .resources()
        .items.map((item) =>
          [
            item.id,
            item.slug,
            item.title,
            item.author.handle,
            item.status,
            item.evidenceStatus,
            item.publishedAt ?? "",
          ]
            .map(csvCell)
            .join(","),
        ),
    ];
    adminState.audit(
      "RESOURCES_EXPORTED",
      "RESOURCE_EXPORT",
      crypto.randomUUID(),
      body.reason.trim(),
    );
    return new HttpResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv;charset=UTF-8",
        "Content-Disposition": "attachment; filename=educhain-resources.csv",
      },
    });
  }),

  http.post("*/api/v1/admin/resources/:resourceId/withdrawals", async ({ params, request }) => {
    return resourceStatusAction(params, request, "WITHDRAWN", "RESOURCE_WITHDRAWN");
  }),

  http.post("*/api/v1/admin/resources/:resourceId/restorations", async ({ params, request }) => {
    return resourceStatusAction(params, request, "PUBLISHED", "RESOURCE_RESTORED");
  }),

  http.get("*/api/v1/admin/comments", async ({ request }) => {
    await delay(130);
    const access = requireGovernance(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as
      components["schemas"]["CommentStatus"] | null;
    return HttpResponse.json(adminState.comments(status ?? undefined));
  }),

  http.post("*/api/v1/admin/comments/:commentId/hiding", async ({ params, request }) => {
    return commentStatusAction(params, request, true, "COMMENT_HIDDEN");
  }),

  http.post("*/api/v1/admin/comments/:commentId/restorations", async ({ params, request }) => {
    return commentStatusAction(params, request, false, "COMMENT_RESTORED");
  }),

  http.get("*/api/v1/admin/reports", async ({ request }) => {
    await delay(120);
    const access = requireGovernance(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as
      components["schemas"]["ReportStatus"] | null;
    return HttpResponse.json(adminState.reports(status ?? undefined));
  }),

  http.put("*/api/v1/admin/reports/:reportId/resolution", async ({ params, request }) => {
    await delay(170);
    const access = requireGovernanceWrite(request);
    if (access) return access;
    const body = (await request.json()) as ReportResolution;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const report = adminState.resolveReport(
      String(params.reportId),
      body.status,
      body.reason.trim(),
    );
    if (!report) {
      return problemResponse({
        status: 409,
        code: "ADMIN_ACTION_NOT_ALLOWED",
        path: pathOf(request),
      });
    }
    adminState.audit(`REPORT_${body.status}`, "REPORT", report.id, body.reason.trim());
    return HttpResponse.json(report);
  }),
];

async function resourceStatusAction(
  params: Record<string, string | readonly string[] | undefined>,
  request: Request,
  status: "PUBLISHED" | "WITHDRAWN",
  action: string,
) {
  await delay(170);
  const access = requireGovernanceWrite(request);
  if (access) return access;
  const body = (await request.json()) as GovernanceReason;
  if (!reasonValid(body.reason)) {
    return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
  }
  const resourceId = String(params.resourceId);
  const resource = adminState.setResourceStatus(resourceId, status);
  if (!resource) {
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }
  adminState.audit(action, "RESOURCE", resourceId, body.reason.trim());
  return HttpResponse.json(resource);
}

async function commentStatusAction(
  params: Record<string, string | readonly string[] | undefined>,
  request: Request,
  hidden: boolean,
  action: string,
) {
  await delay(170);
  const access = requireGovernanceWrite(request);
  if (access) return access;
  const body = (await request.json()) as GovernanceReason;
  if (!reasonValid(body.reason)) {
    return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
  }
  const commentId = String(params.commentId);
  const comment = adminState.setCommentHidden(commentId, hidden);
  if (!comment) {
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  }
  adminState.audit(action, "COMMENT", commentId, body.reason.trim());
  return HttpResponse.json(comment);
}

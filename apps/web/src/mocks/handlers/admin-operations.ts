import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";
import { problemResponse } from "@/mocks/problem";
import { pathOf } from "@/mocks/request-guards";
import { adminState } from "@/mocks/state/admin";
import { authState } from "@/mocks/state/auth";
import {
  quotedVersion,
  reasonValid,
  requireGovernance,
  requireGovernanceWrite,
} from "./admin-handler-support";

type GovernanceReason = components["schemas"]["GovernanceReasonRequest"];

export const adminOperationsHandlers = [
  http.get("*/api/v1/admin/evidence-jobs", async ({ request }) => {
    await delay(120);
    const access = requireGovernance(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as
      components["schemas"]["EvidenceJobStatus"] | null;
    return HttpResponse.json(adminState.evidenceJobs(status ?? undefined));
  }),

  http.post("*/api/v1/admin/evidence-jobs/:jobId/retries", async ({ params, request }) => {
    await delay(180);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const job = adminState.retryEvidence(String(params.jobId));
    if (!job) {
      return problemResponse({
        status: 409,
        code: "ADMIN_ACTION_NOT_ALLOWED",
        path: pathOf(request),
      });
    }
    adminState.audit("EVIDENCE_RETRY_SCHEDULED", "EVIDENCE_JOB", job.id, body.reason.trim());
    return HttpResponse.json(job);
  }),

  http.post(
    "*/api/v1/admin/resources/:resourceId/evidence-requests",
    async ({ params, request }) => {
      await delay(180);
      const access = requireGovernanceWrite(request, true);
      if (access) return access;
      const body = (await request.json()) as GovernanceReason;
      if (!reasonValid(body.reason)) {
        return problemResponse({
          status: 422,
          code: "ADMIN_REASON_REQUIRED",
          path: pathOf(request),
        });
      }
      const resourceId = String(params.resourceId);
      const job = adminState.requestEvidence(resourceId);
      if (!job) {
        return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
      }
      adminState.audit("EVIDENCE_REQUESTED", "RESOURCE", resourceId, body.reason.trim());
      return HttpResponse.json(job, { status: 202 });
    },
  ),

  http.get("*/api/v1/admin/evidence-integrity", async ({ request }) => {
    await delay(110);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.evidenceIntegrity());
  }),

  http.get("*/api/v1/admin/audit-events", async ({ request }) => {
    await delay(120);
    const access = requireGovernance(request, true);
    if (access) return access;
    return HttpResponse.json(
      adminState.audits(new URL(request.url).searchParams.get("targetType") ?? undefined),
    );
  }),

  http.get("*/api/v1/admin/system-health", async ({ request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.health());
  }),

  http.get("*/api/v1/admin/operational-metrics", async ({ request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.operationalMetrics());
  }),

  http.get("*/api/v1/admin/operational-events", async ({ request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    if (access) return access;
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    return HttpResponse.json(adminState.operationalEvents(limit));
  }),

  http.get("*/api/v1/admin/operational-alerts", async ({ request }) => {
    await delay(100);
    const access = requireGovernance(request, true);
    return access ?? HttpResponse.json(adminState.operationalAlerts());
  }),

  http.put("*/api/v1/admin/operational-alerts/:alertId/resolution", async ({ params, request }) => {
    await delay(150);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceReason;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const alert = adminState.resolveOperationalAlert(
      String(params.alertId),
      quotedVersion(request) ?? -1,
      authState.current()!.user.id,
      body.reason.trim(),
    );
    if (!alert) {
      return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
    }
    adminState.audit("OPERATIONAL_ALERT_RESOLVED", "OPERATIONAL_ALERT", alert.id, body.reason);
    return HttpResponse.json(alert);
  }),
];

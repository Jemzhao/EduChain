import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";
import { problemResponse } from "@/mocks/problem";
import { pathOf } from "@/mocks/request-guards";
import { adminState } from "@/mocks/state/admin";
import {
  quotedVersion,
  reasonValid,
  requireGovernance,
  requireGovernanceWrite,
} from "./admin-handler-support";

type GovernanceReason = components["schemas"]["GovernanceReasonRequest"];
type TaxonomyStatusRequest = components["schemas"]["AdminTaxonomyStatusRequest"];
type TaxonomyMergeRequest = components["schemas"]["AdminTaxonomyMergeRequest"];
type CategoryWriteRequest = components["schemas"]["AdminCategoryWriteRequest"];
type TagWriteRequest = components["schemas"]["AdminTagWriteRequest"];
type TaxonomyDeletionBatchRequest = components["schemas"]["AdminTaxonomyDeletionBatchRequest"];

export const adminTaxonomyHandlers = [
  http.get("*/api/v1/admin/taxonomy", async ({ request }) => {
    await delay(120);
    const access = requireGovernance(request);
    return access ?? HttpResponse.json(adminState.taxonomy());
  }),

  http.put("*/api/v1/admin/categories/:itemId/status", taxonomyStatusAction),
  http.put("*/api/v1/admin/tags/:itemId/status", taxonomyStatusAction),
  http.post("*/api/v1/admin/categories", taxonomyCategoryWrite),
  http.put("*/api/v1/admin/categories/:itemId", taxonomyCategoryWrite),
  http.post("*/api/v1/admin/tags", taxonomyTagWrite),
  http.put("*/api/v1/admin/tags/:itemId", taxonomyTagWrite),
  http.post("*/api/v1/admin/categories/:itemId/merges", taxonomyMerge),
  http.post("*/api/v1/admin/tags/:itemId/merges", taxonomyMerge),
  http.delete("*/api/v1/admin/categories/:itemId", taxonomyDelete),
  http.delete("*/api/v1/admin/tags/:itemId", taxonomyDelete),

  http.post("*/api/v1/admin/taxonomy-deletion-batches", async ({ request }) => {
    await delay(170);
    const access = requireGovernanceWrite(request, true);
    if (access) return access;
    const body = (await request.json()) as TaxonomyDeletionBatchRequest;
    if (!reasonValid(body.reason)) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    for (const item of body.items) {
      if (!adminState.deleteTaxonomy(item.id, item.version)) {
        return problemResponse({
          status: 409,
          code: "ADMIN_ACTION_NOT_ALLOWED",
          path: pathOf(request),
        });
      }
      adminState.audit(`${item.kind}_DELETED`, item.kind, item.id, body.reason.trim());
    }
    return HttpResponse.json({ processedCount: body.items.length });
  }),
];

async function taxonomyStatusAction({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) {
  await delay(170);
  const access = requireGovernanceWrite(request, true);
  if (access) return access;
  const body = (await request.json()) as TaxonomyStatusRequest;
  if (!reasonValid(body.reason)) {
    return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
  }
  const itemId = String(params.itemId);
  const current = adminState.taxonomy().items.find((item) => item.id === itemId);
  if (!current) {
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }
  if (quotedVersion(request) !== current.version) {
    return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }
  const item = adminState.setTaxonomyStatus(itemId, body.status);
  if (!item) {
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  }
  adminState.audit(`${item.kind}_STATUS_CHANGED`, item.kind, item.id, body.reason.trim());
  return HttpResponse.json(item);
}

async function taxonomyMerge({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) {
  await delay(170);
  const access = requireGovernanceWrite(request, true);
  if (access) return access;
  const body = (await request.json()) as TaxonomyMergeRequest;
  if (!reasonValid(body.reason)) {
    return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
  }
  const itemId = String(params.itemId);
  const current = adminState.taxonomy().items.find((item) => item.id === itemId);
  if (!current) {
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }
  if (quotedVersion(request) !== current.version) {
    return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }
  const item = adminState.mergeTaxonomy(itemId, body.targetId);
  if (!item) {
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  }
  adminState.audit(`${item.kind}_MERGED`, item.kind, item.id, body.reason.trim());
  return HttpResponse.json(item);
}

async function taxonomyDelete({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) {
  await delay(150);
  const access = requireGovernanceWrite(request, true);
  if (access) return access;
  const body = (await request.json()) as GovernanceReason;
  if (!reasonValid(body.reason)) {
    return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
  }
  const itemId = String(params.itemId);
  const current = adminState.taxonomy().items.find((item) => item.id === itemId);
  if (!current) {
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }
  if (quotedVersion(request) !== current.version) {
    return problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }
  if (!adminState.deleteTaxonomy(itemId, current.version)) {
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  }
  adminState.audit(`${current.kind}_DELETED`, current.kind, itemId, body.reason.trim());
  return new HttpResponse(null, { status: 204 });
}

async function taxonomyCategoryWrite({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) {
  await delay(170);
  const access = requireGovernanceWrite(request, true);
  if (access) return access;
  const body = (await request.json()) as CategoryWriteRequest;
  if (!reasonValid(body.reason)) {
    return problemResponse({
      status: 422,
      code: "FIELD_VALIDATION_FAILED",
      path: pathOf(request),
    });
  }
  const itemId = params.itemId ? String(params.itemId) : undefined;
  const current = itemId
    ? adminState.taxonomy().items.find((item) => item.id === itemId)
    : undefined;
  if (itemId && (!current || quotedVersion(request) !== current.version)) {
    return problemResponse({
      status: current ? 409 : 404,
      code: current ? "VERSION_CONFLICT" : "RESOURCE_NOT_FOUND",
      path: pathOf(request),
    });
  }
  const item = adminState.writeCategory(body, itemId);
  if (!item)
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  adminState.audit(
    itemId ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
    "CATEGORY",
    item.id,
    body.reason,
  );
  return HttpResponse.json(item);
}

async function taxonomyTagWrite({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) {
  await delay(170);
  const access = requireGovernanceWrite(request, true);
  if (access) return access;
  const body = (await request.json()) as TagWriteRequest;
  if (!reasonValid(body.reason)) {
    return problemResponse({
      status: 422,
      code: "FIELD_VALIDATION_FAILED",
      path: pathOf(request),
    });
  }
  const itemId = params.itemId ? String(params.itemId) : undefined;
  const current = itemId
    ? adminState.taxonomy().items.find((item) => item.id === itemId)
    : undefined;
  if (itemId && (!current || quotedVersion(request) !== current.version)) {
    return problemResponse({
      status: current ? 409 : 404,
      code: current ? "VERSION_CONFLICT" : "RESOURCE_NOT_FOUND",
      path: pathOf(request),
    });
  }
  const item = adminState.writeTag(body, itemId);
  if (!item)
    return problemResponse({
      status: 409,
      code: "ADMIN_ACTION_NOT_ALLOWED",
      path: pathOf(request),
    });
  adminState.audit(itemId ? "TAG_UPDATED" : "TAG_CREATED", "TAG", item.id, body.reason);
  return HttpResponse.json(item);
}

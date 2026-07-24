import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { externalContentState } from "@/mocks/state/external-content";

type SourceWrite = components["schemas"]["ExternalContentSourceWriteRequest"];
type Review = components["schemas"]["ExternalContentReviewRequest"];
type Quality = components["schemas"]["ExternalContentQualityStatus"];

function requireRole(request: Request, administrator = false, write = false) {
  const current = authState.current();
  if (!current) {
    return problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path: pathOf(request) });
  }
  const allowed = administrator
    ? current.roles.includes("ADMINISTRATOR")
    : current.roles.some((role) => role === "MODERATOR" || role === "ADMINISTRATOR");
  if (!allowed)
    return problemResponse({ status: 403, code: "ACCESS_DENIED", path: pathOf(request) });
  return write ? requireWriteAccess(request) : undefined;
}

const versionOf = (request: Request) => {
  const match = request.headers.get("If-Match")?.match(/^"(\d+)"$/);
  return match ? Number(match[1]) : -1;
};

export const externalContentHandlers = [
  http.get("*/api/v1/external-content", async ({ request }) => {
    await delay(100);
    return HttpResponse.json(
      externalContentState.publicItems(new URL(request.url).searchParams.get("query") ?? ""),
    );
  }),
  http.get("*/api/v1/admin/external-content/sources", async ({ request }) => {
    await delay(100);
    return requireRole(request, true) ?? HttpResponse.json(externalContentState.sources());
  }),
  http.post("*/api/v1/admin/external-content/sources", async ({ request }) => {
    await delay(140);
    const access = requireRole(request, true, true);
    if (access) return access;
    const body = (await request.json()) as SourceWrite;
    if (!body.siteUrl.startsWith("https://") || !body.feedUrl.startsWith("https://")) {
      return problemResponse({
        status: 422,
        code: "EXTERNAL_FETCH_REJECTED",
        path: pathOf(request),
      });
    }
    return HttpResponse.json(externalContentState.createSource(body), { status: 201 });
  }),
  http.put("*/api/v1/admin/external-content/sources/:sourceId", async ({ params, request }) => {
    await delay(140);
    const access = requireRole(request, true, true);
    if (access) return access;
    const body = (await request.json()) as SourceWrite;
    const result = externalContentState.updateSource(
      String(params.sourceId),
      versionOf(request),
      body,
    );
    return result
      ? HttpResponse.json(result)
      : problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }),
  http.post(
    "*/api/v1/admin/external-content/sources/:sourceId/sync",
    async ({ params, request }) => {
      await delay(300);
      const access = requireRole(request, true, true);
      if (access) return access;
      const result = externalContentState.sync(String(params.sourceId));
      return result
        ? HttpResponse.json(result)
        : problemResponse({ status: 409, code: "EXTERNAL_SOURCE_DISABLED", path: pathOf(request) });
    },
  ),
  http.get("*/api/v1/admin/external-content/items", async ({ request }) => {
    await delay(100);
    const access = requireRole(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as Quality | null;
    return HttpResponse.json(externalContentState.items(status ?? undefined));
  }),
  http.put("*/api/v1/admin/external-content/items/:itemId/review", async ({ params, request }) => {
    await delay(140);
    const access = requireRole(request, false, true);
    if (access) return access;
    const body = (await request.json()) as Review;
    if (body.reason.trim().length < 10) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const result = externalContentState.review(
      String(params.itemId),
      versionOf(request),
      body.status,
    );
    return result
      ? HttpResponse.json(result)
      : problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }),
];

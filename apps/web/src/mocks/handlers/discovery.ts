import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireAuth, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { discoveryState } from "@/mocks/state/discovery";
import { resourceState } from "@/mocks/state/resources";

type RecordView = components["schemas"]["RecordResourceViewRequest"];

export const discoveryHandlers = [
  http.post("*/api/v1/resources/:resourceId/views", async ({ params, request }) => {
    await delay(60);
    const resourceId = String(params.resourceId);
    if (!resourceState.get(resourceId)) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    const body = (await request.json()) as RecordView;
    return HttpResponse.json(discoveryState.recordView(resourceId, body.viewerKey));
  }),
  http.get("*/api/v1/resources/:resourceId/statistics", async ({ params, request }) => {
    await delay(60);
    const resourceId = String(params.resourceId);
    return resourceState.get(resourceId)
      ? HttpResponse.json(discoveryState.statistics(resourceId))
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),
  http.get("*/api/v1/users/me/history", async ({ request }) => {
    await delay(80);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    return HttpResponse.json(discoveryState.history(authState.current()!.user.id, limit));
  }),
  http.delete("*/api/v1/users/me/history", async ({ request }) => {
    await delay(80);
    const access = requireWriteAccess(request);
    if (access) return access;
    discoveryState.clearHistory(authState.current()!.user.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/api/v1/users/me/search-history", async ({ request }) => {
    await delay(70);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    return HttpResponse.json(discoveryState.searchHistory(authState.current()!.user.id, limit));
  }),
  http.delete("*/api/v1/users/me/search-history", async ({ request }) => {
    await delay(70);
    const access = requireWriteAccess(request);
    if (access) return access;
    discoveryState.clearSearchHistory(authState.current()!.user.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete("*/api/v1/users/me/search-history/:historyId", async ({ params, request }) => {
    await delay(70);
    const access = requireWriteAccess(request);
    if (access) return access;
    return discoveryState.deleteSearchHistory(
      authState.current()!.user.id,
      String(params.historyId),
    )
      ? new HttpResponse(null, { status: 204 })
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),
  http.get("*/api/v1/users/me/activity", async ({ request }) => {
    await delay(80);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 30);
    return HttpResponse.json(discoveryState.activity(authState.current()!.user.id, limit));
  }),
  http.get("*/api/v1/recommendations/resources", async ({ request }) => {
    await delay(120);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 12);
    return HttpResponse.json(discoveryState.recommendations(limit));
  }),
  http.put(
    "*/api/v1/recommendations/resources/:resourceId/feedback",
    async ({ params, request }) => {
      await delay(80);
      const access = requireWriteAccess(request);
      if (access) return access;
      const resourceId = String(params.resourceId);
      if (!resourceState.get(resourceId)) {
        return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
      }
      return HttpResponse.json(
        discoveryState.dismissRecommendation(authState.current()!.user.id, resourceId),
      );
    },
  ),
];

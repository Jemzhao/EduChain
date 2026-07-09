import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { mockCategories, mockTags } from "@/mocks/fixtures/taxonomy";
import { problemResponse } from "@/mocks/problem";
import { pathOf, requireAuth, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { fileState } from "@/mocks/state/files";
import { communityState } from "@/mocks/state/community";
import { discoveryState } from "@/mocks/state/discovery";
import { resourceState } from "@/mocks/state/resources";

type CreateDraft = components["schemas"]["CreateResourceDraftRequest"];
type UpdateDraft = components["schemas"]["UpdateResourceDraftRequest"];
type CreateUpload = components["schemas"]["CreateUploadRequest"];
type ResourceSort = components["schemas"]["ResourceSort"];
type ResourceStatus = components["schemas"]["ResourceStatus"];
type RestoreResourceVersionRequest = components["schemas"]["RestoreResourceVersionRequest"];
type GovernanceReasonRequest = components["schemas"]["GovernanceReasonRequest"];

const quotedVersion = (request: Request) => {
  const match = request.headers.get("If-Match")?.match(/^"(\d+)"$/);
  return match ? Number(match[1]) : undefined;
};

export const taxonomyHandlers = [
  http.get("*/api/v1/categories", async () => {
    await delay(80);
    return HttpResponse.json({ items: mockCategories });
  }),
  http.get("*/api/v1/tags", async ({ request }) => {
    await delay(80);
    const url = new URL(request.url);
    const query = (url.searchParams.get("query") ?? "").toLowerCase();
    const limit = Number(url.searchParams.get("limit") ?? 20);
    return HttpResponse.json({
      items: mockTags
        .filter((tag) => `${tag.name} ${tag.slug}`.toLowerCase().includes(query))
        .slice(0, limit),
    });
  }),
];

export const resourceHandlers = [
  http.get("*/api/v1/users/me/resources", async ({ request }) => {
    await delay(120);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const status = new URL(request.url).searchParams.get("status") as ResourceStatus | null;
    return HttpResponse.json(resourceState.listOwned(status ?? undefined));
  }),

  http.get("*/api/v1/resources/:resourceId/draft", async ({ params, request }) => {
    await delay(120);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const draft = resourceState.draft(String(params.resourceId));
    return draft
      ? HttpResponse.json(draft)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.patch("*/api/v1/resources/:resourceId/draft", async ({ params, request }) => {
    await delay(180);
    const access = requireWriteAccess(request);
    if (access) return access;
    const resourceId = String(params.resourceId);
    const current = resourceState.draft(resourceId);
    if (!current) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    const expectedVersion = quotedVersion(request);
    if (expectedVersion !== current.draftVersion) {
      return problemResponse({
        status: 409,
        code: "VERSION_CONFLICT",
        path: pathOf(request),
        parameters: { currentVersion: String(current.draftVersion) },
      });
    }
    const body = (await request.json()) as UpdateDraft;
    const updated = resourceState.updateDraft(resourceId, body);
    return HttpResponse.json(updated!);
  }),

  http.post("*/api/v1/resources/:resourceId/publications", async ({ params, request }) => {
    await delay(260);
    const access = requireWriteAccess(request);
    if (access) return access;
    const resourceId = String(params.resourceId);
    const draft = resourceState.draft(resourceId);
    if (!draft) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    if (quotedVersion(request) !== draft.draftVersion) {
      return problemResponse({
        status: 409,
        code: "VERSION_CONFLICT",
        path: pathOf(request),
        parameters: { currentVersion: String(draft.draftVersion) },
      });
    }
    const missing = [
      draft.title.length < 3 && "title",
      draft.summary.length < 20 && "summary",
      ["ARTICLE", "DOCUMENT"].includes(draft.resourceType) && draft.body.length < 100 && "body",
      ["VIDEO", "LINK"].includes(draft.resourceType) &&
        !/^https:\/\/.+/.test(draft.sourceUrl) &&
        "sourceUrl",
      !draft.categoryId && "categoryId",
      !draft.copyrightStatement && "copyrightStatement",
    ].filter(Boolean);
    if (missing.length > 0) {
      return problemResponse({
        status: 409,
        code: "RESOURCE_NOT_PUBLISHABLE",
        path: pathOf(request),
        parameters: { fields: missing.join(",") },
      });
    }
    const publication = await resourceState.publish(resourceId);
    if (publication) {
      const resource = resourceState.get(resourceId);
      if (resource) communityState.notifyFollowersPublished(resource.author.id, resourceId);
    }
    discoveryState.recordActivity(authState.current()?.user.id, "PUBLISHED_RESOURCE", resourceId);
    return HttpResponse.json(publication!, { status: 201 });
  }),

  http.get("*/api/v1/resources/:resourceId/versions", async ({ params, request }) => {
    await delay(100);
    const history = resourceState.versions(String(params.resourceId));
    return history
      ? HttpResponse.json(history)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.post("*/api/v1/resources/:resourceId/draft-restorations", async ({ params, request }) => {
    await delay(180);
    const access = requireWriteAccess(request);
    if (access) return access;
    const resourceId = String(params.resourceId);
    const draft = resourceState.draft(resourceId);
    if (!draft) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    if (quotedVersion(request) !== draft.draftVersion) {
      return problemResponse({
        status: 409,
        code: "VERSION_CONFLICT",
        path: pathOf(request),
        parameters: { currentVersion: String(draft.draftVersion) },
      });
    }
    const body = (await request.json()) as RestoreResourceVersionRequest;
    const restored = resourceState.restore(resourceId, body.versionId);
    return restored
      ? HttpResponse.json(restored)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.post("*/api/v1/resources/:resourceId/withdrawals", async ({ params, request }) => {
    return resourceLifecycle(params, request, "WITHDRAWN");
  }),

  http.post("*/api/v1/resources/:resourceId/restorations", async ({ params, request }) => {
    return resourceLifecycle(params, request, "PUBLISHED");
  }),

  http.get("*/api/v1/resources", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const items = resourceState
      .list()
      .filter((resource) => !category || resource.category.slug === category)
      .filter((resource) => !tag || resource.tags.some((item) => item.slug === tag))
      .slice(0, limit);
    return HttpResponse.json({ items, page: { nextCursor: null, hasMore: false } });
  }),

  http.post("*/api/v1/resources", async ({ request }) => {
    await delay(180);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as CreateDraft;
    return HttpResponse.json(resourceState.createDraft(body.title, body.resourceType), {
      status: 201,
    });
  }),

  http.get("*/api/v1/resources/:resourceKey", async ({ params, request }) => {
    await delay(130);
    const resource = resourceState.get(String(params.resourceKey));
    return resource
      ? HttpResponse.json(resource)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),
];

async function resourceLifecycle(
  params: { resourceId?: string | readonly string[] },
  request: Request,
  target: "PUBLISHED" | "WITHDRAWN",
) {
  await delay(160);
  const access = requireWriteAccess(request);
  if (access) return access;
  const body = (await request.json()) as GovernanceReasonRequest;
  if (body.reason.trim().length < 10 || body.reason.trim().length > 500) {
    return problemResponse({ status: 422, code: "FIELD_VALIDATION_FAILED", path: pathOf(request) });
  }
  const resourceId = String(params.resourceId);
  const current = resourceState.draft(resourceId);
  const expected = target === "WITHDRAWN" ? "PUBLISHED" : "WITHDRAWN";
  if (!current) {
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }
  if (current.status !== expected) {
    return problemResponse({
      status: 409,
      code: "RESOURCE_ALREADY_WITHDRAWN",
      path: pathOf(request),
    });
  }
  resourceState.setStatus(resourceId, target);
  const summary = resourceState
    .listOwned(target)
    .items.find((item) => item.resourceId === resourceId);
  return summary
    ? HttpResponse.json(summary)
    : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
}

export const fileHandlers = [
  http.post("*/api/v1/uploads", async ({ request }) => {
    await delay(120);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as CreateUpload;
    if (body.size > 26_214_400) {
      return problemResponse({ status: 413, code: "UPLOAD_TOO_LARGE", path: pathOf(request) });
    }
    return HttpResponse.json(fileState.create(body), { status: 201 });
  }),
  http.put("*/api/v1/uploads/:uploadId/content", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const received = fileState.receive(String(params.uploadId), await request.arrayBuffer());
    return received
      ? new HttpResponse(null, { status: 204 })
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),
  http.post("*/api/v1/uploads/:uploadId/completion", async ({ params, request }) => {
    await delay(180);
    const access = requireWriteAccess(request);
    if (access) return access;
    const file = await fileState.complete(String(params.uploadId));
    if (!file) {
      return problemResponse({ status: 409, code: "UPLOAD_NOT_READY", path: pathOf(request) });
    }
    if (file.status === "REJECTED") {
      return problemResponse({ status: 422, code: "UPLOAD_REJECTED", path: pathOf(request) });
    }
    return HttpResponse.json(file);
  }),
  http.get("*/api/v1/files/:fileId", async ({ params, request }) => {
    await delay(70);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const file = fileState.getByFileId(String(params.fileId));
    return file
      ? HttpResponse.json(file)
      : problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),
  http.get("*/api/v1/files/:fileId/content", async ({ params, request }) => {
    await delay(60);
    const content = fileState.contentByFileId(String(params.fileId));
    if (!content) {
      return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
    }
    return new HttpResponse(content.bytes, {
      status: 200,
      headers: {
        "Content-Type": content.mediaType,
        "Cache-Control": "no-cache",
      },
    });
  }),
];

export const searchHandlers = [
  http.get("*/api/v1/search/resources", async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const query = (url.searchParams.get("query") ?? "").trim().toLowerCase();
    const category = url.searchParams.get("category");
    const author = url.searchParams.get("author");
    const tags = (url.searchParams.get("tags") ?? "").split(",").filter(Boolean);
    const sort = (url.searchParams.get("sort") ?? "RELEVANCE") as ResourceSort;
    const tokens = query.split(/\s+/).filter(Boolean);
    const items = resourceState
      .list()
      .filter((resource) => !category || resource.category.slug === category)
      .filter((resource) => !author || resource.author.handle === author)
      .filter((resource) => tags.every((tag) => resource.tags.some((item) => item.slug === tag)))
      .map((resource) => {
        const haystacks = {
          TITLE: resource.title.toLowerCase(),
          SUMMARY: resource.summary.toLowerCase(),
          BODY: resource.body.toLowerCase(),
          AUTHOR: `${resource.author.displayName} ${resource.author.handle}`.toLowerCase(),
          CATEGORY: resource.category.slug,
          TAG: resource.tags
            .map((tag) => `${tag.name} ${tag.slug}`)
            .join(" ")
            .toLowerCase(),
        };
        const matchedFields = Object.entries(haystacks)
          .filter(([, value]) => tokens.some((token) => value.includes(token)))
          .map(([field]) => field as keyof typeof haystacks);
        const rankingSignals = [
          ...matchedFields.map((field) => `${field}_MATCH` as const),
          "QUALITY" as const,
          "FRESHNESS" as const,
        ];
        return {
          resource,
          matchedFields,
          highlights: matchedFields.slice(0, 2).map((field) => ({
            field,
            text:
              field === "BODY"
                ? `${resource.body.slice(0, 220)}…`
                : field === "TITLE"
                  ? resource.title
                  : resource.summary,
          })),
          rankingSignals,
          score: matchedFields.length,
        };
      })
      .filter((item) => !query || item.matchedFields.length > 0)
      .sort((left, right) =>
        sort === "NEWEST"
          ? right.resource.publishedAt.localeCompare(left.resource.publishedAt)
          : right.score - left.score,
      );
    discoveryState.recordSearch(authState.current()?.user.id, query, items.length);
    return HttpResponse.json({
      queryId: crypto.randomUUID(),
      normalizedQuery: query,
      items: items.map((item) => ({
        resource: item.resource,
        matchedFields: item.matchedFields,
        highlights: item.highlights,
        rankingSignals: item.rankingSignals,
      })),
      page: { nextCursor: null, hasMore: false },
    });
  }),
  http.get("*/api/v1/search/suggestions", async ({ request }) => {
    const query = (new URL(request.url).searchParams.get("query") ?? "").toLowerCase();
    const items = [
      ...mockTags.filter((tag) => tag.name.toLowerCase().includes(query)).map((tag) => tag.name),
      ...resourceState
        .list()
        .filter((item) => item.title.toLowerCase().includes(query))
        .map((item) => item.title),
    ].slice(0, 8);
    return HttpResponse.json({ items });
  }),
  http.get("*/api/v1/search/popular-keywords", async ({ request }) => {
    await delay(60);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 10);
    return HttpResponse.json(discoveryState.popularSearches(limit));
  }),
];

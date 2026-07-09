import type { components } from "@educhain/api-contract";

import { mockNow } from "@/mocks/clock";
import { authState } from "@/mocks/state/auth";
import { fileState } from "@/mocks/state/files";
import { mockPublishedResources, type MockResourceDetail } from "@/mocks/fixtures/resources";
import { mockCategories, mockTags } from "@/mocks/fixtures/taxonomy";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type ResourceDraft = components["schemas"]["ResourceDraftResponse"];
type UpdateDraft = components["schemas"]["UpdateResourceDraftRequest"];
type Publication = components["schemas"]["PublicationResponse"];
type ResourceStatus = components["schemas"]["ResourceStatus"];
type MyResourceList = components["schemas"]["MyResourceListResponse"];
type ResourceVersionList = components["schemas"]["ResourceVersionListResponse"];

const storageKey = "educhain.mock.resources.v5";
const published = new Map(
  mockPublishedResources.map((resource) => [resource.id, structuredClone(resource)]),
);
const drafts = new Map<string, ResourceDraft>();
const versions = new Map(
  mockPublishedResources.map((resource) => [resource.id, [structuredClone(resource)]]),
);
const statuses = new Map<string, ResourceStatus>(
  mockPublishedResources.map((resource) => [resource.id, "PUBLISHED"]),
);
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const stored = readMockSession<{
    published: Array<[string, MockResourceDetail]>;
    drafts: Array<[string, ResourceDraft]>;
    versions: Array<[string, MockResourceDetail[]]>;
    statuses: Array<[string, ResourceStatus]>;
  }>(storageKey);
  if (!stored) return;
  published.clear();
  drafts.clear();
  versions.clear();
  statuses.clear();
  for (const [resourceId, resource] of stored.published) published.set(resourceId, resource);
  for (const [resourceId, draft] of stored.drafts) drafts.set(resourceId, draft);
  for (const [resourceId, items] of stored.versions) versions.set(resourceId, items);
  for (const [resourceId, status] of stored.statuses ?? []) statuses.set(resourceId, status);
  for (const resourceId of published.keys()) {
    if (!statuses.has(resourceId)) statuses.set(resourceId, "PUBLISHED");
  }
}

function persist(): void {
  writeMockSession(storageKey, {
    published: [...published],
    drafts: [...drafts],
    versions: [...versions],
    statuses: [...statuses],
  });
}

const slugify = (title: string, id: string) => {
  const base = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
  return `${base || "knowledge-resource"}-${id.replaceAll("-", "").slice(0, 8)}`;
};

export const resourceState = {
  list(): MockResourceDetail[] {
    hydrate();
    return [...published.values()]
      .filter((resource) => statuses.get(resource.id) === "PUBLISHED")
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .map((resource) => structuredClone(resource));
  },
  get(key: string): MockResourceDetail | undefined {
    hydrate();
    const resource = [...published.values()].find(
      (item) => statuses.get(item.id) === "PUBLISHED" && (item.id === key || item.slug === key),
    );
    return resource ? structuredClone(resource) : undefined;
  },
  listGoverned(): MockResourceDetail[] {
    hydrate();
    return [...published.values()]
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .map((resource) => structuredClone(resource));
  },
  getGoverned(key: string): MockResourceDetail | undefined {
    hydrate();
    const resource = [...published.values()].find((item) => item.id === key || item.slug === key);
    return resource ? structuredClone(resource) : undefined;
  },
  status(resourceId: string): ResourceStatus | undefined {
    hydrate();
    return statuses.get(resourceId);
  },
  setStatus(resourceId: string, status: "PUBLISHED" | "WITHDRAWN") {
    hydrate();
    if (!published.has(resourceId)) return undefined;
    statuses.set(resourceId, status);
    const draft = drafts.get(resourceId);
    if (draft) drafts.set(resourceId, { ...draft, status });
    persist();
    return this.getGoverned(resourceId);
  },
  createDraft(title = "", resourceType: components["schemas"]["ResourceType"]): ResourceDraft {
    hydrate();
    const id = crypto.randomUUID();
    const draft: ResourceDraft = {
      resourceId: id,
      slug: `draft-${id.replaceAll("-", "").slice(0, 12)}`,
      status: "DRAFT",
      resourceVersion: 0,
      draftVersion: 0,
      title: title.trim(),
      summary: "",
      body: "",
      resourceType,
      sourceUrl: "",
      categoryId: null,
      tagIds: [],
      coverFileId: null,
      attachments: [],
      copyrightStatement: "",
      savedAt: mockNow(),
    };
    drafts.set(id, draft);
    statuses.set(id, "DRAFT");
    persist();
    return structuredClone(draft);
  },
  draft(resourceId: string): ResourceDraft | undefined {
    hydrate();
    const draft = drafts.get(resourceId);
    return draft ? structuredClone(draft) : undefined;
  },
  listOwned(status?: ResourceStatus): MyResourceList {
    hydrate();
    return {
      items: [...drafts.values()]
        .filter((draft) => !status || draft.status === status)
        .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
        .map((draft) => {
          const current = published.get(draft.resourceId);
          return {
            resourceId: draft.resourceId,
            slug: draft.slug,
            status: draft.status,
            resourceType: draft.resourceType,
            title: draft.title,
            summary: draft.summary,
            draftVersion: draft.draftVersion,
            savedAt: draft.savedAt,
            publishedAt: current?.publishedAt ?? null,
            publicVersionNumber: current?.versionNumber ?? null,
          };
        }),
    };
  },
  versions(resourceId: string): ResourceVersionList | undefined {
    hydrate();
    const current = published.get(resourceId);
    const history = versions.get(resourceId);
    if (!current || !history) return undefined;
    return {
      resourceId,
      items: history
        .toSorted((left, right) => right.versionNumber - left.versionNumber)
        .map((version) => ({
          id: version.versionId,
          versionNumber: version.versionNumber,
          title: version.title,
          summary: version.summary,
          contentDigest: version.contentDigest,
          publishedAt: version.publishedAt,
          current: version.versionId === current.versionId,
        })),
    };
  },
  restore(resourceId: string, versionId: string): ResourceDraft | undefined {
    hydrate();
    const currentDraft = drafts.get(resourceId);
    const version = versions.get(resourceId)?.find((item) => item.versionId === versionId);
    if (!currentDraft || !version) return undefined;
    const restored: ResourceDraft = {
      ...currentDraft,
      title: version.title,
      summary: version.summary,
      body: version.body,
      sourceUrl: version.sourceUrl,
      categoryId: version.category.id,
      tagIds: version.tags.map((tag) => tag.id),
      attachments: version.attachments.map((file, order) => ({
        fileId: file.fileId,
        displayName: file.displayName,
        purpose: "ATTACHMENT",
        order,
      })),
      copyrightStatement: version.copyrightStatement,
      draftVersion: currentDraft.draftVersion + 1,
      savedAt: mockNow(),
    };
    drafts.set(resourceId, restored);
    persist();
    return structuredClone(restored);
  },
  updateDraft(resourceId: string, body: UpdateDraft): ResourceDraft | undefined {
    hydrate();
    const current = drafts.get(resourceId);
    if (!current) return undefined;
    const updated: ResourceDraft = {
      ...current,
      ...body,
      draftVersion: current.draftVersion + 1,
      savedAt: mockNow(),
    };
    drafts.set(resourceId, updated);
    persist();
    return structuredClone(updated);
  },
  async publish(resourceId: string): Promise<Publication | undefined> {
    hydrate();
    const draft = drafts.get(resourceId);
    const currentUser = authState.current();
    if (!draft || !currentUser || !draft.categoryId) return undefined;
    const digestBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(draft)),
    );
    const digest = [...new Uint8Array(digestBuffer)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    const resource: MockResourceDetail = {
      id: resourceId,
      slug: slugify(draft.title, resourceId),
      title: draft.title,
      summary: draft.summary,
      body: draft.body,
      resourceType: draft.resourceType,
      sourceUrl: draft.sourceUrl,
      author: {
        id: currentUser.user.id,
        handle: currentUser.user.handle,
        displayName: currentUser.user.displayName,
        avatarUrl: currentUser.user.avatarUrl,
      },
      category: mockCategories.find((item) => item.id === draft.categoryId)!,
      tags: draft.tagIds
        .map((id) => mockTags.find((item) => item.id === id))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
      publishedAt: mockNow(),
      readingMinutes: Math.max(1, Math.ceil(draft.body.replace(/\s/g, "").length / 500)),
      evidenceStatus: "PENDING",
      versionId: crypto.randomUUID(),
      versionNumber: (published.get(resourceId)?.versionNumber ?? 0) + 1,
      copyrightStatement: draft.copyrightStatement,
      attachments: draft.attachments.flatMap((attachment) => {
        const file = fileState.getByFileId(attachment.fileId);
        return file
          ? [
              {
                fileId: file.id,
                displayName: attachment.displayName,
                mediaType: file.detectedMediaType ?? file.declaredMediaType,
                size: file.size,
                sha256: file.sha256 ?? "",
                order: attachment.order,
              },
            ]
          : [];
      }),
      contentDigest: digest,
    };
    published.set(resourceId, resource);
    statuses.set(resourceId, "PUBLISHED");
    versions.set(resourceId, [...(versions.get(resourceId) ?? []), structuredClone(resource)]);
    drafts.set(resourceId, {
      ...draft,
      slug: resource.slug,
      status: "PUBLISHED",
      resourceVersion: draft.resourceVersion + 1,
    });
    persist();
    return {
      resource: structuredClone(resource),
      processing: { search: "PENDING", evidence: "PENDING" },
    };
  },
};

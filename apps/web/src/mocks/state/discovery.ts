import type { components } from "@educhain/api-contract";

import { mockBeforeHours, mockNow } from "@/mocks/clock";
import { mockUsers } from "@/mocks/fixtures/auth";
import { mockPublishedResources } from "@/mocks/fixtures/resources";
import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { resourceState } from "@/mocks/state/resources";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type ActivityType = components["schemas"]["ActivityType"];
type ActivityItem = components["schemas"]["ActivityItem"];
type ResourceCard = components["schemas"]["ResourceCard"];
type SearchHistoryItem = components["schemas"]["SearchHistoryItem"];

type View = {
  resourceId: string;
  userId?: string;
  viewerKey: string;
  viewedAt: string;
};

type State = {
  views: View[];
  activities: Array<ActivityItem & { userId: string }>;
  dismissedRecommendations: Record<string, string[]>;
  searchHistories: Array<SearchHistoryItem & { userId: string }>;
};

const seedSearchQueries = [
  "区块链存证",
  "Spring Boot",
  "智能检索",
  "计算机网络",
  "数据结构",
  "机器学习",
  "开放教育资源",
  "Next.js",
];

const seedState: State = {
  views: mockUsers.flatMap((user, userIndex) =>
    mockPublishedResources.slice(0, 8).map((resource, resourceIndex) => ({
      resourceId:
        mockPublishedResources[(resourceIndex + userIndex * 3) % mockPublishedResources.length].id,
      userId: user.user.id,
      viewerKey: `seed-${userIndex}-${resourceIndex}`,
      viewedAt: mockBeforeHours(8 + userIndex * 17 + resourceIndex * 5),
    })),
  ),
  activities: mockUsers.flatMap((user, userIndex) =>
    mockPublishedResources.slice(0, 7).map((resource, resourceIndex) => ({
      id: `57000000-0000-4000-8000-${String(userIndex * 10 + resourceIndex + 1).padStart(12, "0")}`,
      userId: user.user.id,
      type: (
        ["VIEWED_RESOURCE", "LIKED_RESOURCE", "SAVED_RESOURCE", "COMMENTED_RESOURCE"] as const
      )[resourceIndex % 4],
      resourceId:
        mockPublishedResources[(resourceIndex + userIndex * 2) % mockPublishedResources.length].id,
      createdAt: mockBeforeHours(10 + userIndex * 19 + resourceIndex * 6),
    })),
  ),
  dismissedRecommendations: {},
  searchHistories: mockUsers.flatMap((user, userIndex) =>
    Array.from({ length: 12 }, (_, searchIndex) => ({
      id: `58000000-0000-4000-8000-${String(userIndex * 20 + searchIndex + 1).padStart(12, "0")}`,
      userId: user.user.id,
      query: seedSearchQueries[(searchIndex + userIndex * 2) % seedSearchQueries.length],
      resultCount: 3 + ((searchIndex + userIndex) % 16),
      searchedAt: mockBeforeHours(4 + userIndex * 11 + searchIndex * 9),
    })),
  ),
};

const storageKey = "educhain.mock.discovery.v2";
let state: State = structuredClone(seedState);
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  state = readMockSession<State>(storageKey) ?? structuredClone(seedState);
  state.dismissedRecommendations ??= {};
  state.searchHistories ??= structuredClone(seedState.searchHistories);
}

function persist() {
  writeMockSession(storageKey, state);
}

function card(resourceId: string): ResourceCard | undefined {
  const resource = resourceState.get(resourceId);
  if (!resource) return undefined;
  return {
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    summary: resource.summary,
    resourceType: resource.resourceType,
    author: resource.author,
    category: resource.category,
    tags: resource.tags,
    publishedAt: resource.publishedAt,
    readingMinutes: resource.readingMinutes,
    evidenceStatus: resource.evidenceStatus,
  };
}

export const discoveryState = {
  recordActivity(userId: string | undefined, type: ActivityType, resourceId: string) {
    if (!userId) return;
    hydrate();
    state.activities.unshift({
      id: crypto.randomUUID(),
      userId,
      type,
      resourceId,
      createdAt: mockNow(),
    });
    state.activities = state.activities.slice(0, 200);
    persist();
  },
  recordView(resourceId: string, viewerKey: string) {
    hydrate();
    const userId = authState.current()?.user.id;
    const existing = state.views.find(
      (view) => view.resourceId === resourceId && view.viewerKey === viewerKey,
    );
    if (existing) {
      existing.userId = userId ?? existing.userId;
      existing.viewedAt = mockNow();
    } else {
      state.views.push({ resourceId, viewerKey, userId, viewedAt: mockNow() });
    }
    this.recordActivity(userId, "VIEWED_RESOURCE", resourceId);
    persist();
    return {
      resourceId,
      viewCount: state.views.filter((view) => view.resourceId === resourceId).length,
    };
  },
  statistics(resourceId: string) {
    hydrate();
    return {
      resourceId,
      views: state.views.filter((view) => view.resourceId === resourceId).length,
      ...communityState.statistics(resourceId),
    };
  },
  history(userId: string, limit: number) {
    hydrate();
    const seen = new Set<string>();
    return {
      items: state.views
        .filter((view) => view.userId === userId)
        .toSorted((left, right) => right.viewedAt.localeCompare(left.viewedAt))
        .flatMap((view) => {
          if (seen.has(view.resourceId)) return [];
          seen.add(view.resourceId);
          const resource = card(view.resourceId);
          return resource ? [{ resource, viewedAt: view.viewedAt }] : [];
        })
        .slice(0, limit),
    };
  },
  clearHistory(userId: string) {
    hydrate();
    state.views = state.views.filter((view) => view.userId !== userId);
    persist();
  },
  recordSearch(userId: string | undefined, query: string, resultCount: number) {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (!userId || !normalized) return;
    hydrate();
    state.searchHistories.unshift({
      id: crypto.randomUUID(),
      userId,
      query: normalized,
      resultCount,
      searchedAt: mockNow(),
    });
    state.searchHistories = state.searchHistories
      .filter((item, index) => item.userId !== userId || index < 100)
      .slice(0, 500);
    persist();
  },
  searchHistory(userId: string, limit: number) {
    hydrate();
    return {
      items: state.searchHistories
        .filter((item) => item.userId === userId)
        .toSorted((left, right) => right.searchedAt.localeCompare(left.searchedAt))
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          query: item.query,
          resultCount: item.resultCount,
          searchedAt: item.searchedAt,
        })),
    };
  },
  clearSearchHistory(userId: string) {
    hydrate();
    state.searchHistories = state.searchHistories.filter((item) => item.userId !== userId);
    persist();
  },
  deleteSearchHistory(userId: string, historyId: string) {
    hydrate();
    const before = state.searchHistories.length;
    state.searchHistories = state.searchHistories.filter(
      (item) => item.userId !== userId || item.id !== historyId,
    );
    if (state.searchHistories.length === before) return false;
    persist();
    return true;
  },
  popularSearches(limit: number) {
    hydrate();
    const counts = new Map<string, { query: string; searchCount: number }>();
    state.searchHistories.forEach((item) => {
      const key = item.query.toLocaleLowerCase();
      const current = counts.get(key) ?? { query: item.query, searchCount: 0 };
      current.searchCount += 1;
      counts.set(key, current);
    });
    return {
      items: [...counts.values()]
        .toSorted(
          (left, right) =>
            right.searchCount - left.searchCount || left.query.localeCompare(right.query),
        )
        .slice(0, limit),
    };
  },
  activity(userId: string, limit: number) {
    hydrate();
    return {
      items: state.activities
        .filter((activity) => activity.userId === userId)
        .slice(0, limit)
        .map((activity) => ({
          id: activity.id,
          type: activity.type,
          resourceId: activity.resourceId,
          createdAt: activity.createdAt,
        })),
    };
  },
  viewedCount(userId: string) {
    hydrate();
    return state.activities.filter(
      (activity) => activity.userId === userId && activity.type === "VIEWED_RESOURCE",
    ).length;
  },
  recommendations(limit: number) {
    hydrate();
    const viewed = new Set(
      state.views
        .filter((view) => view.userId === authState.current()?.user.id)
        .map((view) => view.resourceId),
    );
    const items = resourceState
      .list()
      .filter(
        (resource) =>
          !state.dismissedRecommendations[authState.current()?.user.id ?? "anonymous"]?.includes(
            resource.id,
          ),
      )
      .map((resource) => card(resource.id)!)
      .toSorted((left, right) => Number(viewed.has(left.id)) - Number(viewed.has(right.id)))
      .slice(0, limit);
    return { items, page: { nextCursor: null, hasMore: false } };
  },
  dismissRecommendation(userId: string, resourceId: string) {
    hydrate();
    const dismissed = (state.dismissedRecommendations[userId] ??= []);
    if (!dismissed.includes(resourceId)) dismissed.push(resourceId);
    persist();
    return { resourceId, feedback: "DISMISSED" as const, updatedAt: mockNow() };
  },
};

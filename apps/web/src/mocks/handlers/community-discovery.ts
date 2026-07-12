import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireAuth } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { discoveryState } from "@/mocks/state/discovery";
import { resourceState } from "@/mocks/state/resources";

type ResourceDetail = components["schemas"]["ResourceDetailResponse"];
type ResourceCard = components["schemas"]["ResourceCard"];
type AchievementDefinition = components["schemas"]["AchievementDefinition"];
type AchievementStatistics = components["schemas"]["AchievementStatistics"];
type AchievementLevel = components["schemas"]["AchievementLevel"];

const catalog: AchievementDefinition[] = [
  definition("first-publication", "FIRST_PUBLICATION", "PUBLISHED_RESOURCES", 1, 40),
  definition("knowledge-builder", "KNOWLEDGE_BUILDER", "PUBLISHED_RESOURCES", 5, 120),
  definition("community-voice", "COMMUNITY_VOICE", "COMMENTS", 10, 80),
  definition("appreciated", "APPRECIATED", "RECEIVED_LIKES", 25, 120),
  definition("trusted-creator", "TRUSTED_CREATOR", "FOLLOWERS", 10, 150),
  definition("curious-reader", "CURIOUS_READER", "VIEWED_RESOURCES", 20, 50),
];

export const communityDiscoveryHandlers = [
  http.get("*/api/v1/community", async ({ request }) => {
    await delay(140);
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") === "FOLLOWING" ? "FOLLOWING" : "GLOBAL";
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 12)));
    const pageIndex = decodeCommunityCursor(url.searchParams.get("cursor"), scope);
    if (pageIndex === undefined) {
      return problemResponse({ status: 400, code: "REQUEST_INVALID", path: pathOf(request) });
    }
    const current = authState.current();
    if (scope === "FOLLOWING" && !current) {
      return problemResponse({
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
        path: pathOf(request),
      });
    }
    const resources = resourceState.list();
    const matchingResources = resources.filter(
      (resource) =>
        scope === "GLOBAL" || communityState.follow(current!.user.id, resource.author.id).following,
    );
    const offset = pageIndex * limit;
    const feedResources = matchingResources.slice(offset, offset + limit);
    const hasMore = offset + feedResources.length < matchingResources.length;
    const topics = new Map<string, { name: string; resourceIds: Set<string> }>();
    for (const resource of resources) {
      for (const tag of resource.tags) {
        const topic = topics.get(tag.slug) ?? { name: tag.name, resourceIds: new Set() };
        topic.resourceIds.add(resource.id);
        topics.set(tag.slug, topic);
      }
    }
    const creators = new Map<
      string,
      { author: ResourceDetail["author"]; resourceCount: number; engagementScore: number }
    >();
    for (const resource of resources) {
      const currentCreator = creators.get(resource.author.id) ?? {
        author: resource.author,
        resourceCount: 0,
        engagementScore: 0,
      };
      const signals = communityState.statistics(resource.id);
      currentCreator.resourceCount += 1;
      currentCreator.engagementScore +=
        1 + signals.likes * 3 + signals.saves * 2 + signals.comments * 2;
      creators.set(resource.author.id, currentCreator);
    }
    const metrics = communityState.platformMetrics();
    return HttpResponse.json({
      statistics: {
        members: authState.all().length,
        publishedResources: resources.length,
        likes: metrics.likes,
        comments: metrics.comments,
      },
      topics: [...topics.entries()]
        .map(([slug, topic]) => ({
          slug,
          name: topic.name,
          resourceCount: topic.resourceIds.size,
        }))
        .toSorted((left, right) => right.resourceCount - left.resourceCount)
        .slice(0, 12),
      activeCreators: [...creators.values()]
        .toSorted((left, right) => right.engagementScore - left.engagementScore)
        .slice(0, 8),
      feed: feedResources.map((resource) => ({
        id: resource.id,
        type: "RESOURCE_PUBLISHED" as const,
        resource: card(resource),
        createdAt: resource.publishedAt,
      })),
      page: {
        nextCursor: hasMore ? encodeCommunityCursor(pageIndex + 1, scope) : null,
        hasMore,
      },
      effectiveScope: scope,
    });
  }),
  http.get("*/api/v1/achievements", async () => {
    await delay(70);
    return HttpResponse.json({ items: catalog });
  }),
  http.get("*/api/v1/users/me/achievements", async ({ request }) => {
    await delay(100);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    return HttpResponse.json(profile(authState.current()!.user.id));
  }),
  http.get("*/api/v1/leaderboards/contributors", async ({ request }) => {
    await delay(120);
    const limit = Math.min(
      50,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 20)),
    );
    const ranked = authState
      .all()
      .map((account) => ({ account, profile: profile(account.user.id) }))
      .toSorted(
        (left, right) =>
          right.profile.totalPoints - left.profile.totalPoints ||
          left.account.user.handle.localeCompare(right.account.user.handle),
      )
      .slice(0, limit);
    return HttpResponse.json({
      items: ranked.map(({ account, profile: item }, index) => ({
        rank: index + 1,
        user: {
          id: account.user.id,
          handle: account.user.handle,
          displayName: account.user.displayName,
          avatarUrl: account.user.avatarUrl,
        },
        points: item.totalPoints,
        level: item.level,
        publishedResources: item.statistics.publishedResources,
        receivedLikes: item.statistics.receivedLikes,
      })),
    });
  }),
];

function decodeCommunityCursor(cursor: string | null, scope: "GLOBAL" | "FOLLOWING") {
  if (!cursor) return 0;
  try {
    const decoded = atob(cursor.replaceAll("-", "+").replaceAll("_", "/"));
    const [namespace, encodedScope, page] = decoded.split(":");
    const pageIndex = Number(page);
    if (
      namespace !== "community" ||
      encodedScope !== scope ||
      !Number.isInteger(pageIndex) ||
      pageIndex < 0
    ) {
      return undefined;
    }
    return pageIndex;
  } catch {
    return undefined;
  }
}

function encodeCommunityCursor(page: number, scope: "GLOBAL" | "FOLLOWING") {
  return btoa(`community:${scope}:${page}`)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function card(resource: ResourceDetail): ResourceCard {
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

function profile(userId: string) {
  const authoredResources = resourceState
    .list()
    .filter((resource) => resource.author.id === userId)
    .map((resource) => resource.id);
  const contributions = communityState.contributionMetrics(userId, authoredResources);
  const statistics: AchievementStatistics = {
    publishedResources: authoredResources.length,
    comments: contributions.comments,
    receivedLikes: contributions.receivedLikes,
    followers: contributions.followers,
    viewedResources: discoveryState.viewedCount(userId),
  };
  const totalPoints =
    statistics.publishedResources * 40 +
    statistics.comments * 3 +
    statistics.receivedLikes * 5 +
    statistics.followers * 10 +
    Math.min(statistics.viewedResources, 100);
  return {
    totalPoints,
    level: level(totalPoints),
    nextLevelPoints: nextLevelPoints(totalPoints),
    unlockedCount: catalog.filter((item) => metric(statistics, item.metric) >= item.target).length,
    statistics,
    items: catalog.map((achievement) => ({
      achievement,
      current: metric(statistics, achievement.metric),
      unlocked: metric(statistics, achievement.metric) >= achievement.target,
    })),
  };
}

function metric(statistics: AchievementStatistics, metricName: AchievementDefinition["metric"]) {
  const mapping = {
    PUBLISHED_RESOURCES: statistics.publishedResources,
    COMMENTS: statistics.comments,
    RECEIVED_LIKES: statistics.receivedLikes,
    FOLLOWERS: statistics.followers,
    VIEWED_RESOURCES: statistics.viewedResources,
  };
  return mapping[metricName];
}

function level(points: number): AchievementLevel {
  if (points >= 1_500) return "MENTOR";
  if (points >= 700) return "SCHOLAR";
  if (points >= 300) return "CURATOR";
  if (points >= 100) return "CONTRIBUTOR";
  return "LEARNER";
}

function nextLevelPoints(points: number) {
  if (points < 100) return 100;
  if (points < 300) return 300;
  if (points < 700) return 700;
  if (points < 1_500) return 1_500;
  return null;
}

function definition(
  id: string,
  key: string,
  metricName: AchievementDefinition["metric"],
  target: number,
  points: number,
): AchievementDefinition {
  return {
    id,
    titleKey: `achievement.${key}.title`,
    descriptionKey: `achievement.${key}.description`,
    metric: metricName,
    target,
    points,
  };
}

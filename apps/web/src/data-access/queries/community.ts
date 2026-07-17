import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type NotificationType = components["schemas"]["NotificationType"];
type CommunityFeedScope = components["schemas"]["CommunityFeedScope"];

export async function getLikeState(resourceId: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/like", {
      params: { path: { resourceId } },
    }),
  );
}

export async function getCollections(resourceId?: string) {
  return unwrapApiResult(
    await apiClient.GET("/collections", {
      params: { query: { resourceId } },
    }),
  );
}

export async function getCollectionItems(collectionId: string, cursor?: string) {
  return unwrapApiResult(
    await apiClient.GET("/collections/{collectionId}/items", {
      params: {
        path: { collectionId },
        query: { cursor, limit: 24 },
      },
    }),
  );
}

export async function getResourceComments(resourceId: string, cursor?: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/comments", {
      params: {
        path: { resourceId },
        query: { cursor, limit: 20 },
      },
    }),
  );
}

export async function getFollowState(userId: string) {
  return unwrapApiResult(
    await apiClient.GET("/users/{userId}/follow", {
      params: { path: { userId } },
    }),
  );
}

export async function getFollowers(userId: string, cursor?: string) {
  return unwrapApiResult(
    await apiClient.GET("/users/{userId}/followers", {
      params: { path: { userId }, query: { cursor, limit: 20 } },
    }),
  );
}

export async function getFollowing(userId: string, cursor?: string) {
  return unwrapApiResult(
    await apiClient.GET("/users/{userId}/following", {
      params: { path: { userId }, query: { cursor, limit: 20 } },
    }),
  );
}

export async function getNotifications(filters?: { type?: NotificationType; read?: boolean }) {
  return unwrapApiResult(
    await apiClient.GET("/notifications", {
      params: {
        query: {
          type: filters?.type,
          read: filters?.read,
          limit: 30,
        },
      },
    }),
  );
}

export async function getNotificationPreferences() {
  return unwrapApiResult(await apiClient.GET("/notification-preferences"));
}

export async function getBrowsingHistory(limit = 20) {
  return unwrapApiResult(
    await apiClient.GET("/users/me/history", { params: { query: { limit } } }),
  );
}

export async function getMyActivity(limit = 30) {
  return unwrapApiResult(
    await apiClient.GET("/users/me/activity", { params: { query: { limit } } }),
  );
}

export async function getCommunityOverview(
  scope: CommunityFeedScope = "GLOBAL",
  cursor?: string,
  limit = 12,
) {
  return unwrapApiResult(
    await apiClient.GET("/community", { params: { query: { scope, cursor, limit } } }),
  );
}

export async function getAchievementCatalog() {
  return unwrapApiResult(await apiClient.GET("/achievements"));
}

export async function getMyAchievementProfile() {
  return unwrapApiResult(await apiClient.GET("/users/me/achievements"));
}

export async function getContributorLeaderboard(limit = 20) {
  return unwrapApiResult(
    await apiClient.GET("/leaderboards/contributors", { params: { query: { limit } } }),
  );
}

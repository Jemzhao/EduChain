import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { ensureApiSuccess, unwrapApiResult } from "@/data-access/http/result";

type CreateCommentRequest = components["schemas"]["CreateCommentRequest"];
type UpdatePreferencesRequest = components["schemas"]["UpdateNotificationPreferencesRequest"];

async function writeHeaders() {
  return { "X-XSRF-TOKEN": await getCsrfToken() };
}

export async function setLikeState(resourceId: string, liked: boolean) {
  return unwrapApiResult(
    await apiClient.PUT("/resources/{resourceId}/like", {
      body: { liked },
      params: { path: { resourceId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function createCollection(name: string) {
  return unwrapApiResult(
    await apiClient.POST("/collections", {
      body: { name },
      params: { header: { "Idempotency-Key": crypto.randomUUID() } },
      headers: await writeHeaders(),
    }),
  );
}

export async function updateCollection(collectionId: string, name: string, version: number) {
  return unwrapApiResult(
    await apiClient.PATCH("/collections/{collectionId}", {
      body: { name },
      params: {
        path: { collectionId },
        header: { "If-Match": `"${version}"` },
      },
      headers: await writeHeaders(),
    }),
  );
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const result = await apiClient.DELETE("/collections/{collectionId}", {
    params: { path: { collectionId } },
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function addCollectionItem(collectionId: string, resourceId: string) {
  return unwrapApiResult(
    await apiClient.PUT("/collections/{collectionId}/items/{resourceId}", {
      params: { path: { collectionId, resourceId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function removeCollectionItem(
  collectionId: string,
  resourceId: string,
): Promise<void> {
  const result = await apiClient.DELETE("/collections/{collectionId}/items/{resourceId}", {
    params: { path: { collectionId, resourceId } },
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function createComment(resourceId: string, body: CreateCommentRequest) {
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/comments", {
      body,
      params: {
        path: { resourceId },
        header: { "Idempotency-Key": crypto.randomUUID() },
      },
      headers: await writeHeaders(),
    }),
  );
}

export async function deleteComment(commentId: string) {
  return unwrapApiResult(
    await apiClient.DELETE("/comments/{commentId}", {
      params: { path: { commentId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function setFollowState(userId: string, following: boolean) {
  return unwrapApiResult(
    await apiClient.PUT("/users/{userId}/follow", {
      body: { following },
      params: { path: { userId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function setNotificationReadState(notificationId: string, read: boolean) {
  return unwrapApiResult(
    await apiClient.PUT("/notifications/{notificationId}/read-state", {
      body: { read },
      params: { path: { notificationId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function markAllNotificationsRead() {
  return unwrapApiResult(
    await apiClient.POST("/notification-read-batches", {
      body: { scope: "ALL", notificationIds: [] },
      headers: await writeHeaders(),
    }),
  );
}

export async function markSelectedNotificationsRead(notificationIds: string[]) {
  return unwrapApiResult(
    await apiClient.POST("/notification-read-batches", {
      body: { scope: "SELECTED", notificationIds },
      headers: await writeHeaders(),
    }),
  );
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const result = await apiClient.DELETE("/notifications/{notificationId}", {
    params: { path: { notificationId } },
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function deleteNotifications(notificationIds?: string[]) {
  return unwrapApiResult(
    await apiClient.POST("/notification-deletion-batches", {
      body: {
        scope: notificationIds ? "SELECTED" : "ALL",
        notificationIds: notificationIds ?? [],
      },
      headers: await writeHeaders(),
    }),
  );
}

export async function updateNotificationPreferences(body: UpdatePreferencesRequest) {
  return unwrapApiResult(
    await apiClient.PUT("/notification-preferences", {
      body,
      headers: await writeHeaders(),
    }),
  );
}

export async function recordResourceView(resourceId: string, viewerKey: string) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/views", {
      body: { viewerKey },
      params: { path: { resourceId } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function clearBrowsingHistory(): Promise<void> {
  const result = await apiClient.DELETE("/users/me/history", {
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function clearSearchHistory(): Promise<void> {
  const result = await apiClient.DELETE("/users/me/search-history", {
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function deleteSearchHistoryItem(historyId: string): Promise<void> {
  const result = await apiClient.DELETE("/users/me/search-history/{historyId}", {
    params: { path: { historyId } },
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function dismissResourceRecommendation(resourceId: string) {
  return unwrapApiResult(
    await apiClient.PUT("/recommendations/resources/{resourceId}/feedback", {
      params: { path: { resourceId } },
      headers: await writeHeaders(),
    }),
  );
}

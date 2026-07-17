import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireAuth, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { discoveryState } from "@/mocks/state/discovery";
import { resourceState } from "@/mocks/state/resources";

type LikeStateRequest = components["schemas"]["LikeStateRequest"];
type CreateCollectionRequest = components["schemas"]["CreateCollectionRequest"];
type UpdateCollectionRequest = components["schemas"]["UpdateCollectionRequest"];
type CreateCommentRequest = components["schemas"]["CreateCommentRequest"];
type FollowStateRequest = components["schemas"]["FollowStateRequest"];
type NotificationType = components["schemas"]["NotificationType"];
type NotificationReadStateRequest = components["schemas"]["NotificationReadStateRequest"];
type NotificationReadBatchRequest = components["schemas"]["NotificationReadBatchRequest"];
type NotificationDeletionBatchRequest = components["schemas"]["NotificationDeletionBatchRequest"];
type UpdatePreferencesRequest = components["schemas"]["UpdateNotificationPreferencesRequest"];
type CollectionResponse = components["schemas"]["CollectionResponse"];
type CommentResponse = components["schemas"]["CommentResponse"];

type Replay<T> = { digest: string; response: T };
const collectionReplays = new Map<string, Replay<CollectionResponse>>();
const commentReplays = new Map<string, Replay<CommentResponse>>();

const currentUserId = () => authState.current()?.user.id;
const replayKey = (request: Request, scope: string) =>
  `${currentUserId()}:${scope}:${request.headers.get("Idempotency-Key")}`;

export const interactionHandlers = [
  http.get("*/api/v1/resources/:resourceId/like", async ({ params, request }) => {
    await delay(80);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const resourceId = String(params.resourceId);
    if (!resourceState.get(resourceId)) return notFound(request);
    return HttpResponse.json(communityState.like(currentUserId()!, resourceId));
  }),

  http.put("*/api/v1/resources/:resourceId/like", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const resourceId = String(params.resourceId);
    const resource = resourceState.get(resourceId);
    if (!resource) return unavailable(request);
    const body = (await request.json()) as LikeStateRequest;
    const previous = communityState.like(currentUserId()!, resourceId).liked;
    if (body.liked) {
      discoveryState.recordActivity(currentUserId(), "LIKED_RESOURCE", resourceId);
    }
    const result = communityState.setLike(currentUserId()!, resourceId, body.liked);
    if (body.liked && !previous) {
      communityState.notifyResourceLiked(resource.author.id, currentUserId()!, resourceId);
    }
    return HttpResponse.json(result);
  }),

  http.get("*/api/v1/resources/:resourceId/comments", async ({ params, request }) => {
    await delay(120);
    const resourceId = String(params.resourceId);
    if (!resourceState.get(resourceId)) return notFound(request);
    const items = communityState.comments(resourceId, currentUserId());
    return HttpResponse.json({
      items,
      totalCount: items.length,
      page: { nextCursor: null, hasMore: false },
    });
  }),

  http.post("*/api/v1/resources/:resourceId/comments", async ({ params, request }) => {
    await delay(180);
    const access = requireWriteAccess(request);
    if (access) return access;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.length < 16) return validation(request);
    const resourceId = String(params.resourceId);
    const resource = resourceState.get(resourceId);
    if (!resource) return unavailable(request);
    const body = (await request.json()) as CreateCommentRequest;
    if (!body.body.trim() || body.body.length > 2000) return validation(request);
    const digest = JSON.stringify({ resourceId, ...body, body: body.body.trim() });
    const key = replayKey(request, "comment");
    const replay = commentReplays.get(key);
    if (replay) {
      return replay.digest === digest
        ? HttpResponse.json(replay.response, { status: 201 })
        : problemResponse({
            status: 409,
            code: "IDEMPOTENCY_CONFLICT",
            path: pathOf(request),
          });
    }
    const comment = communityState.createComment(
      currentUserId()!,
      resourceId,
      resource.author.id,
      body.body,
      body.parentCommentId,
    );
    if (!comment) {
      return problemResponse({
        status: 422,
        code: "COMMENT_PARENT_INVALID",
        path: pathOf(request),
      });
    }
    commentReplays.set(key, { digest, response: comment });
    discoveryState.recordActivity(currentUserId(), "COMMENTED_RESOURCE", resourceId);
    return HttpResponse.json(comment, { status: 201 });
  }),

  http.delete("*/api/v1/comments/:commentId", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const comment = communityState.deleteComment(currentUserId()!, String(params.commentId));
    return comment ? HttpResponse.json(comment) : notFound(request);
  }),

  http.get("*/api/v1/collections", async ({ request }) => {
    await delay(100);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const resourceId = new URL(request.url).searchParams.get("resourceId") ?? undefined;
    return HttpResponse.json({ items: communityState.collections(currentUserId()!, resourceId) });
  }),

  http.post("*/api/v1/collections", async ({ request }) => {
    await delay(120);
    const access = requireWriteAccess(request);
    if (access) return access;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.length < 16) return validation(request);
    const body = (await request.json()) as CreateCollectionRequest;
    const name = body.name.trim();
    if (!name || name.length > 60) return validation(request);
    const existing = communityState
      .collections(currentUserId()!)
      .some((item) => item.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return problemResponse({
        status: 409,
        code: "COLLECTION_NAME_TAKEN",
        path: pathOf(request),
      });
    }
    const key = replayKey(request, "collection");
    const replay = collectionReplays.get(key);
    if (replay) {
      return replay.digest === name.toLowerCase()
        ? HttpResponse.json(replay.response, { status: 201 })
        : problemResponse({
            status: 409,
            code: "IDEMPOTENCY_CONFLICT",
            path: pathOf(request),
          });
    }
    const collection = communityState.createCollection(currentUserId()!, name);
    collectionReplays.set(key, { digest: name.toLowerCase(), response: collection });
    return HttpResponse.json(collection, { status: 201 });
  }),

  http.patch("*/api/v1/collections/:collectionId", async ({ params, request }) => {
    await delay(110);
    const access = requireWriteAccess(request);
    if (access) return access;
    const collectionId = String(params.collectionId);
    const current = communityState.collection(currentUserId()!, collectionId);
    if (!current) return notFound(request);
    const version = request.headers.get("If-Match")?.match(/^"(\d+)"$/)?.[1];
    if (Number(version) !== current.version) return versionConflict(request, current.version);
    const body = (await request.json()) as UpdateCollectionRequest;
    const duplicate = communityState
      .collections(currentUserId()!)
      .some(
        (item) =>
          item.id !== collectionId && item.name.toLowerCase() === body.name.trim().toLowerCase(),
      );
    if (duplicate) {
      return problemResponse({
        status: 409,
        code: "COLLECTION_NAME_TAKEN",
        path: pathOf(request),
      });
    }
    return HttpResponse.json(
      communityState.updateCollection(currentUserId()!, collectionId, body.name, current.version)!,
    );
  }),

  http.delete("*/api/v1/collections/:collectionId", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const collection = communityState.collection(currentUserId()!, String(params.collectionId));
    if (!collection) return notFound(request);
    if (collection.defaultCollection) {
      return problemResponse({
        status: 409,
        code: "DEFAULT_COLLECTION_PROTECTED",
        path: pathOf(request),
      });
    }
    communityState.deleteCollection(currentUserId()!, collection.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/v1/collections/:collectionId/items", async ({ params, request }) => {
    await delay(120);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const collectionId = String(params.collectionId);
    const collection = communityState.collection(currentUserId()!, collectionId);
    const items = communityState.collectionItems(currentUserId()!, collectionId);
    if (!collection || !items) return notFound(request);
    return HttpResponse.json({
      collection,
      items: items.flatMap((item) => {
        const resource = resourceState.get(item.resourceId);
        return resource ? [{ collectionId, resource, savedAt: item.savedAt }] : [];
      }),
      page: { nextCursor: null, hasMore: false },
    });
  }),

  http.put("*/api/v1/collections/:collectionId/items/:resourceId", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const resourceId = String(params.resourceId);
    if (!resourceState.get(resourceId)) return unavailable(request);
    const item = communityState.addCollectionItem(
      currentUserId()!,
      String(params.collectionId),
      resourceId,
    );
    if (item) {
      discoveryState.recordActivity(currentUserId(), "SAVED_RESOURCE", resourceId);
    }
    return item ? HttpResponse.json({ ...item, saved: true as const }) : notFound(request);
  }),

  http.delete(
    "*/api/v1/collections/:collectionId/items/:resourceId",
    async ({ params, request }) => {
      await delay(100);
      const access = requireWriteAccess(request);
      if (access) return access;
      const removed = communityState.removeCollectionItem(
        currentUserId()!,
        String(params.collectionId),
        String(params.resourceId),
      );
      return removed ? new HttpResponse(null, { status: 204 }) : notFound(request);
    },
  ),
];

export const socialHandlers = [
  http.get("*/api/v1/users/:userId/follow", async ({ params, request }) => {
    await delay(80);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const userId = String(params.userId);
    if (!authState.findById(userId)) return notFound(request);
    if (userId === currentUserId()) return followSelf(request);
    return HttpResponse.json(communityState.follow(currentUserId()!, userId));
  }),
  http.put("*/api/v1/users/:userId/follow", async ({ params, request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const userId = String(params.userId);
    if (!authState.findById(userId)) return notFound(request);
    if (userId === currentUserId()) return followSelf(request);
    const body = (await request.json()) as FollowStateRequest;
    return HttpResponse.json(communityState.setFollow(currentUserId()!, userId, body.following));
  }),
  http.get("*/api/v1/users/:userId/followers", async ({ params, request }) => {
    await delay(80);
    const userId = String(params.userId);
    if (!authState.findById(userId)) return notFound(request);
    return HttpResponse.json({
      items: communityState.followers(userId),
      page: { nextCursor: null, hasMore: false },
    });
  }),
  http.get("*/api/v1/users/:userId/following", async ({ params, request }) => {
    await delay(80);
    const userId = String(params.userId);
    if (!authState.findById(userId)) return notFound(request);
    return HttpResponse.json({
      items: communityState.following(userId),
      page: { nextCursor: null, hasMore: false },
    });
  }),
];

export const notificationHandlers = [
  http.get("*/api/v1/notifications", async ({ request }) => {
    await delay(100);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const url = new URL(request.url);
    const type = (url.searchParams.get("type") as NotificationType | null) ?? undefined;
    const readValue = url.searchParams.get("read");
    const read = readValue === null ? undefined : readValue === "true";
    const items = communityState
      .notifications(currentUserId()!, type, read)
      .map(enrichNotification);
    return HttpResponse.json({
      items,
      unreadCount: communityState.notifications(currentUserId()!, undefined, false).length,
      page: { nextCursor: null, hasMore: false },
    });
  }),
  http.put("*/api/v1/notifications/:notificationId/read-state", async ({ params, request }) => {
    await delay(80);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as NotificationReadStateRequest;
    const notification = communityState.setNotificationRead(
      currentUserId()!,
      String(params.notificationId),
      body.read,
    );
    return notification ? HttpResponse.json(enrichNotification(notification)) : notFound(request);
  }),
  http.delete("*/api/v1/notifications/:notificationId", async ({ params, request }) => {
    await delay(80);
    const access = requireWriteAccess(request);
    if (access) return access;
    return communityState.deleteNotification(currentUserId()!, String(params.notificationId))
      ? new HttpResponse(null, { status: 204 })
      : notFound(request);
  }),
  http.post("*/api/v1/notification-read-batches", async ({ request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as NotificationReadBatchRequest;
    const valid =
      (body.scope === "ALL" && body.notificationIds.length === 0) ||
      (body.scope === "SELECTED" && body.notificationIds.length > 0);
    return valid
      ? HttpResponse.json(
          communityState.markNotificationsRead(
            currentUserId()!,
            body.scope === "SELECTED" ? body.notificationIds : undefined,
          ),
        )
      : problemResponse({
          status: 422,
          code: "NOTIFICATION_BATCH_INVALID",
          path: pathOf(request),
        });
  }),
  http.post("*/api/v1/notification-deletion-batches", async ({ request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as NotificationDeletionBatchRequest;
    const valid =
      (body.scope === "ALL" && body.notificationIds.length === 0) ||
      (body.scope === "SELECTED" && body.notificationIds.length > 0);
    return valid
      ? HttpResponse.json(
          communityState.deleteNotifications(
            currentUserId()!,
            body.scope === "SELECTED" ? body.notificationIds : undefined,
          ),
        )
      : problemResponse({
          status: 422,
          code: "NOTIFICATION_BATCH_INVALID",
          path: pathOf(request),
        });
  }),
  http.get("*/api/v1/notification-preferences", async ({ request }) => {
    await delay(80);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    return HttpResponse.json({ items: communityState.preferences(currentUserId()!) });
  }),
  http.put("*/api/v1/notification-preferences", async ({ request }) => {
    await delay(100);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as UpdatePreferencesRequest;
    const types = new Set(body.items.map((item) => item.type));
    if (types.size !== 8 || body.items.length !== 8) {
      return problemResponse({
        status: 422,
        code: "NOTIFICATION_BATCH_INVALID",
        path: pathOf(request),
      });
    }
    return HttpResponse.json({
      items: communityState.setPreferences(currentUserId()!, body.items),
    });
  }),
];

function enrichNotification<T extends { resourceId?: string | null }>(notification: T) {
  const resource = notification.resourceId ? resourceState.get(notification.resourceId) : undefined;
  return {
    ...notification,
    ...(resource ? { resourceSlug: resource.slug, resourceTitle: resource.title } : {}),
  };
}

function notFound(request: Request) {
  return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
}

function unavailable(request: Request) {
  return problemResponse({
    status: 409,
    code: "INTERACTION_TARGET_UNAVAILABLE",
    path: pathOf(request),
  });
}

function validation(request: Request) {
  return problemResponse({
    status: 422,
    code: "FIELD_VALIDATION_FAILED",
    path: pathOf(request),
  });
}

function versionConflict(request: Request, version: number) {
  return problemResponse({
    status: 409,
    code: "VERSION_CONFLICT",
    path: pathOf(request),
    parameters: { currentVersion: String(version) },
  });
}

function followSelf(request: Request) {
  return problemResponse({
    status: 422,
    code: "FOLLOW_SELF_NOT_ALLOWED",
    path: pathOf(request),
  });
}

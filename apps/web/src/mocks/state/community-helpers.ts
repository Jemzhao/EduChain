import { mockNow } from "@/mocks/clock";
import { demoUser } from "@/mocks/fixtures/auth";
import { authState } from "@/mocks/state/auth";
import { createCommunityCollection } from "./community-factories";
import { communityData, persistCommunityData } from "./community-store";
import type {
  Collection,
  Comment,
  Notification,
  NotificationPreference,
  StoredComment,
} from "./community-state-types";

export function ensureDefault(ownerId: string) {
  const state = communityData();
  if (
    state.collections.some(
      (item) => state.collectionOwners[item.id] === ownerId && item.defaultCollection,
    )
  ) {
    return;
  }
  const timestamp = mockNow();
  const item = createCommunityCollection(crypto.randomUUID(), "", true, 0, timestamp, timestamp);
  state.collections.push(item);
  state.collectionOwners[item.id] = ownerId;
  persistCommunityData();
}

export function ownedCollection(ownerId: string, collectionId: string) {
  const state = communityData();
  return state.collectionOwners[collectionId] === ownerId
    ? state.collections.find((item) => item.id === collectionId)
    : undefined;
}

export function collectionResponse(item: Collection, resourceId?: string): Collection {
  const state = communityData();
  return {
    ...structuredClone(item),
    itemCount: state.collectionItems.filter((entry) => entry.collectionId === item.id).length,
    containsResource: Boolean(
      resourceId &&
      state.collectionItems.some(
        (entry) => entry.collectionId === item.id && entry.resourceId === resourceId,
      ),
    ),
  };
}

export function commentResponse(
  comment: StoredComment,
  viewerId?: string,
  replyCount = 0,
): Comment {
  return {
    id: comment.id,
    resourceId: comment.resourceId,
    parentCommentId: comment.parentCommentId,
    rootCommentId: comment.rootCommentId,
    author: authorFor(comment.authorId),
    body: comment.body,
    status: comment.status,
    replyCount,
    canDelete: comment.status === "VISIBLE" && comment.authorId === viewerId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export function authorFor(userId: string) {
  const user = authState.findById(userId)?.currentUser.user ?? demoUser.user;
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function addNotification(recipientId: string, notification: Notification) {
  const state = communityData();
  const preference = (state.preferences[recipientId] ?? defaultPreferences()).find(
    (item) => item.type === notification.type,
  );
  if (preference && !preference.inAppEnabled) return;
  const duplicate =
    notification.type !== "SYSTEM_ANNOUNCEMENT" &&
    state.notifications.some(
      (item) =>
        state.notificationRecipients[item.id] === recipientId &&
        item.type === notification.type &&
        item.actor?.id === notification.actor?.id &&
        item.commentId === notification.commentId,
    );
  if (duplicate) return;
  state.notifications.push(notification);
  state.notificationRecipients[notification.id] = recipientId;
}

export function defaultPreferences(): NotificationPreference[] {
  return (
    [
      "COMMENT_REPLY",
      "RESOURCE_LIKED",
      "RESOURCE_COMMENT",
      "FOLLOWED_AUTHOR_PUBLISHED",
      "NEW_FOLLOWER",
      "RESOURCE_STATUS",
      "EVIDENCE_RESULT",
      "SYSTEM_ANNOUNCEMENT",
    ] as const
  ).map((type) => ({ type, inAppEnabled: true, externalEnabled: false }));
}

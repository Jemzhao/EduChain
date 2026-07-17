import type { components } from "@educhain/api-contract";

export type Collection = components["schemas"]["CollectionResponse"];
export type Comment = components["schemas"]["CommentResponse"];
export type Notification = components["schemas"]["NotificationResponse"];
export type NotificationPreference = components["schemas"]["NotificationPreference"];
export type NotificationType = components["schemas"]["NotificationType"];

export type StoredComment = Omit<Comment, "author" | "replyCount" | "canDelete"> & {
  authorId: string;
  moderationBody?: string;
};
export type StoredCollectionItem = { collectionId: string; resourceId: string; savedAt: string };
export type Follow = { followerId: string; followedId: string; createdAt: string };
export type CommunityState = {
  likes: Array<{ userId: string; resourceId: string }>;
  collections: Collection[];
  collectionOwners: Record<string, string>;
  collectionItems: StoredCollectionItem[];
  comments: StoredComment[];
  follows: Follow[];
  notifications: Notification[];
  notificationRecipients: Record<string, string>;
  preferences: Record<string, NotificationPreference[]>;
};

import { mockNow } from "@/mocks/clock";
import { authState } from "@/mocks/state/auth";
import { addNotification, defaultPreferences } from "./community-helpers";
import { communityData, persistCommunityData } from "./community-store";
import type { NotificationPreference, NotificationType } from "./community-state-types";

export const communityNotificationState = {
  notifications(userId: string, type?: NotificationType, read?: boolean) {
    const state = communityData();
    return state.notifications
      .filter((item) => state.notificationRecipients[item.id] === userId)
      .filter((item) => !type || item.type === type)
      .filter((item) => read === undefined || item.read === read)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },
  setNotificationRead(userId: string, notificationId: string, read: boolean) {
    const state = communityData();
    if (state.notificationRecipients[notificationId] !== userId) return undefined;
    const item = state.notifications.find((notification) => notification.id === notificationId);
    if (!item) return undefined;
    item.read = read;
    persistCommunityData();
    return structuredClone(item);
  },
  markNotificationsRead(userId: string, ids?: string[]) {
    const state = communityData();
    const selected = ids ? new Set(ids) : undefined;
    let updatedCount = 0;
    state.notifications.forEach((notification) => {
      if (
        state.notificationRecipients[notification.id] === userId &&
        !notification.read &&
        (!selected || selected.has(notification.id))
      ) {
        notification.read = true;
        updatedCount += 1;
      }
    });
    persistCommunityData();
    return { updatedCount, unreadCount: this.notifications(userId, undefined, false).length };
  },
  deleteNotification(userId: string, notificationId: string) {
    const state = communityData();
    if (state.notificationRecipients[notificationId] !== userId) return false;
    state.notifications = state.notifications.filter((item) => item.id !== notificationId);
    delete state.notificationRecipients[notificationId];
    persistCommunityData();
    return true;
  },
  deleteNotifications(userId: string, ids?: string[]) {
    const state = communityData();
    const selected = ids ? new Set(ids) : undefined;
    const removable = state.notifications
      .filter((item) => state.notificationRecipients[item.id] === userId)
      .filter((item) => !selected || selected.has(item.id))
      .map((item) => item.id);
    const removableIds = new Set(removable);
    state.notifications = state.notifications.filter((item) => !removableIds.has(item.id));
    removable.forEach((id) => delete state.notificationRecipients[id]);
    persistCommunityData();
    return {
      deletedCount: removable.length,
      unreadCount: this.notifications(userId, undefined, false).length,
    };
  },
  preferences(userId: string) {
    const state = communityData();
    return structuredClone(state.preferences[userId] ?? defaultPreferences());
  },
  setPreferences(userId: string, items: NotificationPreference[]) {
    const state = communityData();
    state.preferences[userId] = structuredClone(items);
    persistCommunityData();
    return this.preferences(userId);
  },
  broadcastSystemAnnouncement(title: string, body: string) {
    const state = communityData();
    let recipients = 0;
    for (const account of authState.all().filter((item) => item.user.status === "ACTIVE")) {
      const before = state.notifications.length;
      addNotification(account.user.id, {
        id: crypto.randomUUID(),
        type: "SYSTEM_ANNOUNCEMENT",
        systemTitle: title.trim(),
        systemBody: body.trim(),
        read: false,
        createdAt: mockNow(),
      });
      if (state.notifications.length > before) recipients += 1;
    }
    persistCommunityData();
    return recipients;
  },
};

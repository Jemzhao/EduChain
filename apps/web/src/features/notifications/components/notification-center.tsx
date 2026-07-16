"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CheckCheck,
  Heart,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import {
  deleteNotification,
  deleteNotifications,
  markAllNotificationsRead,
  setNotificationReadState,
} from "@/data-access/mutations/community";
import { getNotifications } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type Notification = components["schemas"]["NotificationResponse"];

export function NotificationCenter({ locale }: { locale: string }) {
  const content = useIntlayer("notifications");
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletion, setDeletion] = useState<{ kind: "one" | "selected" | "all"; ids?: string[] }>();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const notifications = useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => getNotifications(unreadOnly ? { read: false } : undefined),
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const readState = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => setNotificationReadState(id, read),
    onSuccess: refresh,
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (target: NonNullable<typeof deletion>) => {
      if (target.kind === "one") {
        await deleteNotification(target.ids![0]);
        return;
      }
      await deleteNotifications(target.kind === "selected" ? target.ids : undefined);
    },
    onSuccess: async () => {
      setDeletion(undefined);
      setSelectedIds([]);
      await refresh();
    },
  });
  const messages = {
    COMMENT_REPLY: content.commentReply,
    RESOURCE_LIKED: content.resourceLiked,
    RESOURCE_COMMENT: content.resourceComment,
    FOLLOWED_AUTHOR_PUBLISHED: content.followedAuthorPublished,
    NEW_FOLLOWER: content.newFollower,
    RESOURCE_STATUS: content.resourceStatus,
    EVIDENCE_RESULT: content.evidenceResult,
    SYSTEM_ANNOUNCEMENT: content.systemAnnouncement,
  };

  if (currentUser.isPending || (currentUser.data && notifications.isPending)) {
    return (
      <p className="py-24 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }
  if (!currentUser.data) {
    return (
      <div className="py-24 text-center">
        <p className="m-0 text-ink-secondary">{content.authenticationRequired}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.authenticationRequired}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-border pb-8">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="m-0 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 mb-0 max-w-2xl text-lg leading-8 text-ink-secondary">
              {content.description}
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
            href={localizedRoute(locale, "/settings/notifications")}
          >
            {content.preferencesAction}
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="inline-flex rounded-sm border border-border bg-surface p-1">
          {[
            { label: content.allFilter, value: false },
            { label: content.unreadFilter, value: true },
          ].map((option) => (
            <button
              aria-pressed={unreadOnly === option.value}
              className={`min-h-9 rounded-[0.35rem] border-0 px-3 text-sm ${
                unreadOnly === option.value
                  ? "bg-surface-subtle font-semibold text-ink"
                  : "bg-transparent text-ink-tertiary hover:text-ink"
              }`}
              key={String(option.value)}
              onClick={() => setUnreadOnly(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="m-0 text-sm text-ink-tertiary">
            {notifications.data?.unreadCount ?? 0} {content.unreadCount}
          </p>
          <Button
            disabled={!notifications.data?.unreadCount || markAll.isPending}
            onClick={() => markAll.mutate()}
            type="button"
            variant="secondary"
          >
            <CheckCheck aria-hidden="true" className="mr-2 size-4" />
            {content.markAllRead}
          </Button>
          {selectedIds.length > 0 ? (
            <Button
              onClick={() => setDeletion({ kind: "selected", ids: selectedIds })}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="mr-2 size-4" />
              {content.deleteSelected} · {selectedIds.length}
            </Button>
          ) : (
            <Button
              disabled={!notifications.data?.items.length}
              onClick={() => setDeletion({ kind: "all" })}
              type="button"
              variant="quiet"
            >
              {content.clearAll}
            </Button>
          )}
        </div>
      </div>

      {deletion ? (
        <section className="mb-5 flex flex-wrap items-center justify-between gap-5 rounded-md border border-danger/25 bg-danger-soft p-5">
          <div>
            <h2 className="m-0 text-base font-semibold text-danger">{content.deletionTitle}</h2>
            <p className="mt-1 mb-0 text-sm text-ink-secondary">
              {deletion.kind === "all"
                ? content.deletionAll
                : deletion.kind === "selected"
                  ? content.deletionSelected
                  : content.deletionOne}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={remove.isPending}
              onClick={() => setDeletion(undefined)}
              variant="secondary"
            >
              {content.cancelDelete}
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() => remove.mutate(deletion)}
              variant="danger"
            >
              {content.confirmDelete}
            </Button>
          </div>
        </section>
      ) : null}
      {remove.isError ? (
        <p className="mb-5 rounded-sm bg-danger-soft p-4 text-sm text-danger" role="alert">
          {content.deletionError}
        </p>
      ) : null}

      {notifications.isError ? (
        <p className="rounded-md bg-danger-soft py-16 text-center text-danger" role="alert">
          {content.error}
        </p>
      ) : notifications.data?.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-20 text-center">
          <Bell aria-hidden="true" className="mx-auto size-7 text-ink-tertiary" />
          <p className="mt-4 mb-0 text-sm text-ink-secondary">{content.empty}</p>
        </div>
      ) : (
        <ul className="m-0 list-none divide-y divide-border rounded-md border border-border bg-surface p-0">
          {notifications.data?.items.map((notification) => (
            <li
              className={`grid gap-4 p-5 sm:grid-cols-[1.5rem_2.5rem_minmax(0,1fr)_auto] sm:items-start ${
                notification.read ? "" : "bg-accent-soft/35"
              }`}
              key={notification.id}
            >
              <label className="flex min-h-10 items-center justify-center">
                <span className="sr-only">{content.selectNotification}</span>
                <input
                  checked={selectedIds.includes(notification.id)}
                  className="size-4 accent-accent"
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, notification.id]
                        : current.filter((id) => id !== notification.id),
                    )
                  }
                  type="checkbox"
                />
              </label>
              <span
                className={`flex size-10 items-center justify-center rounded-sm ${
                  notification.read
                    ? "bg-surface-subtle text-ink-tertiary"
                    : "bg-accent-soft text-accent"
                }`}
              >
                <NotificationIcon type={notification.type} />
              </span>
              <div className="min-w-0">
                {notification.type === "SYSTEM_ANNOUNCEMENT" ? (
                  <>
                    <p className="m-0 font-semibold leading-7 text-ink">
                      {notification.systemTitle ?? content.systemActor}
                    </p>
                    <p className="mt-1 mb-0 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
                      {notification.systemBody ?? messages[notification.type]}
                    </p>
                  </>
                ) : (
                  <p className="m-0 leading-7 text-ink-secondary">
                    <span className="font-semibold text-ink">
                      {notification.actor?.displayName ?? content.systemActor}
                    </span>{" "}
                    {messages[notification.type]}
                  </p>
                )}
                {notification.resourceSlug && notification.resourceTitle ? (
                  <Link
                    className="mt-2 inline-block max-w-full truncate text-sm font-semibold text-accent underline-offset-4 hover:underline"
                    href={localizedRoute(locale, `/resources/${notification.resourceSlug}`)}
                  >
                    {notification.resourceTitle}
                  </Link>
                ) : notification.actor ? (
                  <Link
                    className="mt-2 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline"
                    href={localizedRoute(locale, `/creators/${notification.actor.handle}`)}
                  >
                    @{notification.actor.handle}
                  </Link>
                ) : null}
                <p className="mt-2 mb-0 text-xs text-ink-tertiary">
                  <time dateTime={notification.createdAt}>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(notification.createdAt))}
                  </time>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="min-h-9 rounded-sm border border-border bg-surface px-3 text-xs font-medium text-ink-tertiary hover:text-ink"
                  disabled={readState.isPending}
                  onClick={() =>
                    readState.mutate({ id: notification.id, read: !notification.read })
                  }
                  type="button"
                >
                  {notification.read ? content.markUnread : content.markRead}
                </button>
                <button
                  aria-label={String(content.deleteOne)}
                  className="flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-ink-tertiary hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
                  onClick={() => setDeletion({ kind: "one", ids: [notification.id] })}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: Notification["type"] }) {
  if (type === "SYSTEM_ANNOUNCEMENT") return <Bell aria-hidden="true" className="size-4" />;
  if (type === "COMMENT_REPLY" || type === "RESOURCE_COMMENT") {
    return <MessageCircle aria-hidden="true" className="size-4" />;
  }
  if (type === "RESOURCE_LIKED") return <Heart aria-hidden="true" className="size-4" />;
  if (type === "FOLLOWED_AUTHOR_PUBLISHED") {
    return <BookOpen aria-hidden="true" className="size-4" />;
  }
  if (type === "NEW_FOLLOWER") return <UserPlus aria-hidden="true" className="size-4" />;
  return <ShieldCheck aria-hidden="true" className="size-4" />;
}

"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { updateNotificationPreferences } from "@/data-access/mutations/community";
import { getNotificationPreferences } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type Preference = components["schemas"]["NotificationPreference"];

export function NotificationPreferences({ locale }: { locale: string }) {
  const content = useIntlayer("notifications");
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
    enabled: Boolean(currentUser.data),
    retry: false,
  });

  if (currentUser.isPending || (currentUser.data && preferences.isPending)) {
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
  if (!preferences.data) {
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {content.error}
      </p>
    );
  }
  return <LoadedPreferences initial={preferences.data.items} />;
}

function LoadedPreferences({ initial }: { initial: Preference[] }) {
  const content = useIntlayer("notifications");
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: () => updateNotificationPreferences({ items }),
    onSuccess: (result) => {
      setItems(result.items);
      setSaved(true);
    },
  });
  const labels = {
    COMMENT_REPLY: content.typeCommentReply,
    RESOURCE_LIKED: content.typeResourceLiked,
    RESOURCE_COMMENT: content.typeResourceComment,
    FOLLOWED_AUTHOR_PUBLISHED: content.typeFollowedAuthorPublished,
    NEW_FOLLOWER: content.typeNewFollower,
    RESOURCE_STATUS: content.typeResourceStatus,
    EVIDENCE_RESULT: content.typeEvidenceResult,
    SYSTEM_ANNOUNCEMENT: content.typeSystemAnnouncement,
  };
  const toggle = (type: Preference["type"], field: "inAppEnabled" | "externalEnabled") => {
    setSaved(false);
    setItems((current) =>
      current.map((item) => (item.type === type ? { ...item, [field]: !item[field] } : item)),
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b border-border pb-8">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.preferencesEyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {content.preferencesTitle}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-secondary">
          {content.preferencesDescription}
        </p>
      </header>

      <div className="mt-8 overflow-hidden rounded-md border border-border bg-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_5rem_6.5rem] gap-3 border-b border-border bg-surface-subtle px-5 py-3 text-xs font-semibold text-ink-tertiary sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
          <span />
          <span className="text-center">{content.inAppChannel}</span>
          <span className="text-center">{content.externalChannel}</span>
        </div>
        {items.map((item) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_5rem_6.5rem] items-center gap-3 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
            key={item.type}
          >
            <p className="m-0 text-sm font-semibold">{labels[item.type]}</p>
            <label className="flex justify-center">
              <span className="sr-only">
                {labels[item.type]} · {content.inAppChannel}
              </span>
              <input
                checked={item.inAppEnabled}
                className="size-5 accent-[var(--ed-color-accent)]"
                onChange={() => toggle(item.type, "inAppEnabled")}
                type="checkbox"
              />
            </label>
            <label className="flex justify-center">
              <span className="sr-only">
                {labels[item.type]} · {content.externalChannel}
              </span>
              <input
                checked={item.externalEnabled}
                className="size-5 accent-[var(--ed-color-accent)]"
                onChange={() => toggle(item.type, "externalEnabled")}
                type="checkbox"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p
          className={`m-0 text-sm ${mutation.isError ? "text-danger" : "text-success"}`}
          role={mutation.isError ? "alert" : "status"}
        >
          {mutation.isError ? content.preferencesError : saved ? content.saved : ""}
        </p>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} type="button">
          {content.savePreferences}
        </Button>
      </div>
    </div>
  );
}

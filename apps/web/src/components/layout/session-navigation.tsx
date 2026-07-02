"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Bookmark, History, Shield } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { getCurrentUser } from "@/data-access/queries/user";
import { getNotifications } from "@/data-access/queries/community";
import { localizedRoute } from "@/lib/routing/localized-route";

export function SessionNavigation({ locale }: { locale: string }) {
  const content = useIntlayer("global-navigation");
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const signedIn = Boolean(currentUser.data);
  const canAdminister = currentUser.data?.roles.some(
    (role) => role === "MODERATOR" || role === "ADMINISTRATOR",
  );
  const unreadNotifications = useQuery({
    queryKey: ["notifications", "navigation"],
    queryFn: () => getNotifications({ read: false }),
    enabled: signedIn,
    retry: false,
    refetchInterval: 60_000,
  });

  return signedIn ? (
    <>
      <Link
        aria-label={String(content.library)}
        className="inline-flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink"
        href={localizedRoute(locale, "/library")}
      >
        <Bookmark aria-hidden="true" className="size-4" />
        <span className="hidden xl:inline">{content.library}</span>
      </Link>
      <Link
        aria-label={String(content.activity)}
        className="hidden min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink lg:inline-flex"
        href={localizedRoute(locale, "/activity")}
      >
        <History aria-hidden="true" className="size-4" />
        <span className="hidden xl:inline">{content.activity}</span>
      </Link>
      {canAdminister ? (
        <Link
          aria-label={String(content.administration)}
          className="hidden min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink lg:inline-flex"
          href={localizedRoute(locale, "/admin")}
        >
          <Shield aria-hidden="true" className="size-4" />
          <span className="hidden xl:inline">{content.administration}</span>
        </Link>
      ) : null}
      <Link
        aria-label={String(content.notifications)}
        className="relative inline-flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink"
        href={localizedRoute(locale, "/notifications")}
      >
        <Bell aria-hidden="true" className="size-4" />
        <span className="hidden xl:inline">{content.notifications}</span>
        {(unreadNotifications.data?.unreadCount ?? 0) > 0 ? (
          <span className="absolute top-1 right-0 flex min-w-4 items-center justify-center rounded-[var(--ed-radius-pill)] bg-accent px-1 text-[0.625rem] leading-4 font-semibold text-white xl:static">
            {Math.min(unreadNotifications.data!.unreadCount, 99)}
          </span>
        ) : null}
      </Link>
      <Link
        className="hidden min-h-10 items-center rounded-sm px-2 text-sm font-medium text-ink-secondary no-underline hover:text-ink md:inline-flex"
        href={localizedRoute(locale, "/studio")}
      >
        {content.create}
      </Link>
      <Link
        className="inline-flex min-h-10 items-center rounded-sm border border-border-strong bg-surface px-3.5 text-sm font-semibold no-underline hover:bg-surface-subtle"
        href={localizedRoute(locale, "/settings/profile")}
      >
        {content.profile}
      </Link>
    </>
  ) : (
    <Link
      className="inline-flex min-h-10 items-center rounded-sm border border-border-strong bg-surface px-3.5 text-sm font-semibold no-underline hover:bg-surface-subtle"
      href={localizedRoute(locale, "/sign-in")}
    >
      {content.signIn}
    </Link>
  );
}

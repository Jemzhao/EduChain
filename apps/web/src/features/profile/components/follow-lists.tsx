"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { getFollowers, getFollowing } from "@/data-access/queries/community";
import { localizedRoute } from "@/lib/routing/localized-route";

export function FollowLists({ userId, locale }: { userId: string; locale: string }) {
  const content = useIntlayer("profile-page");
  const followers = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => getFollowers(userId),
    retry: false,
  });
  const following = useQuery({
    queryKey: ["following", userId],
    queryFn: () => getFollowing(userId),
    retry: false,
  });

  if (followers.isPending || following.isPending) {
    return (
      <p className="mt-7 text-sm text-ink-tertiary" aria-live="polite">
        {content.loadingConnections}
      </p>
    );
  }

  if (!followers.data || !following.data) {
    return (
      <p className="mt-7 text-sm text-danger" role="alert">
        {content.connectionsError}
      </p>
    );
  }

  const lists = [
    { key: "followers", label: content.followers, items: followers.data.items },
    { key: "following", label: content.following, items: following.data.items },
  ];

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {lists.map((list) => (
        <section className="rounded-sm border border-border bg-surface-subtle p-5" key={list.key}>
          <h2 className="m-0 text-sm font-semibold">{list.label}</h2>
          {list.items.length ? (
            <ul className="mt-4 grid list-none gap-2 p-0">
              {list.items.map((user) => (
                <li key={user.id}>
                  <Link
                    className="flex min-h-12 items-center gap-3 rounded-sm px-2 no-underline hover:bg-surface"
                    href={localizedRoute(locale, `/creators/${user.handle}`)}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
                    >
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.displayName}</span>
                      <span className="block truncate font-mono text-xs text-ink-tertiary">
                        @{user.handle}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 mb-0 text-sm text-ink-tertiary">{content.connectionsEmpty}</p>
          )}
        </section>
      ))}
    </div>
  );
}

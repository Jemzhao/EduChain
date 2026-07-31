"use client";

import type { components } from "@educhain/api-contract";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { getCommunityOverview, getContributorLeaderboard } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { ResourceCard } from "@/features/resources/components/resource-card";
import { localizedRoute } from "@/lib/routing/localized-route";

type Scope = components["schemas"]["CommunityFeedScope"];
const COMMUNITY_PAGE_SIZE = 12;

export function CommunityPage({ locale }: { locale: string }) {
  const content = useIntlayer("community-page");
  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState<Array<string | undefined>>([undefined]);
  const cursor = pageCursors[pageIndex];
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const overview = useQuery({
    queryKey: ["community", scope, cursor],
    queryFn: () => getCommunityOverview(scope, cursor, COMMUNITY_PAGE_SIZE),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const leaderboard = useQuery({
    queryKey: ["contributor-leaderboard", 5],
    queryFn: () => getContributorLeaderboard(5),
    retry: false,
  });

  if (overview.isPending) {
    return <p className="py-24 text-center text-ink-secondary">{content.loading}</p>;
  }
  if (!overview.data) {
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {content.loadError}
      </p>
    );
  }

  const statistics = [
    { icon: Users, label: content.members, value: overview.data.statistics.members },
    {
      icon: BookOpen,
      label: content.resources,
      value: overview.data.statistics.publishedResources,
    },
    { icon: Heart, label: content.likes, value: overview.data.statistics.likes },
    { icon: MessageCircle, label: content.comments, value: overview.data.statistics.comments },
  ];

  const selectScope = (nextScope: Scope) => {
    setScope(nextScope);
    setPageIndex(0);
    setPageCursors([undefined]);
  };

  const goToNextPage = () => {
    const nextCursor = overview.data?.page.nextCursor;
    if (!nextCursor) return;
    setPageCursors((current) => {
      const next = current.slice(0, pageIndex + 1);
      next[pageIndex + 1] = nextCursor;
      return next;
    });
    setPageIndex((current) => current + 1);
  };

  return (
    <div>
      <header className="max-w-4xl border-b border-border pb-10">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.045em] text-pretty sm:text-6xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-secondary">{content.description}</p>
      </header>

      <dl className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
        {statistics.map(({ icon: Icon, label, value }, index) => (
          <div
            className={`border-border py-5 ${index >= 2 ? "border-t" : ""} ${
              index % 2 === 0 ? "border-r pr-4" : "pl-4"
            } lg:border-t-0 lg:border-r lg:px-6 lg:py-7 lg:first:pl-0 lg:last:border-r-0`}
            key={String(label)}
          >
            <dt className="flex items-center gap-2 text-sm text-ink-tertiary">
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </dt>
            <dd className="mt-2 ml-0 text-3xl font-semibold tracking-[-0.04em]">
              {new Intl.NumberFormat(locale).format(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="m-0 text-3xl font-semibold tracking-[-0.035em]">
                {content.feedTitle}
              </h2>
              {!currentUser.data ? (
                <p className="mt-2 mb-0 text-sm text-ink-tertiary">{content.followingHint}</p>
              ) : null}
            </div>
            <div className="inline-flex rounded-sm border border-border bg-surface p-1">
              {(
                [
                  ["GLOBAL", content.globalFeed],
                  ["FOLLOWING", content.followingFeed],
                ] as const
              ).map(([value, label]) => (
                <button
                  aria-pressed={scope === value}
                  className={`min-h-10 rounded-[0.35rem] border-0 px-3 text-sm ${
                    scope === value
                      ? "bg-surface-subtle font-semibold text-ink"
                      : "bg-transparent text-ink-tertiary"
                  }`}
                  disabled={value === "FOLLOWING" && !currentUser.data}
                  key={value}
                  onClick={() => selectScope(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {overview.data.feed.length ? (
            <>
              <div aria-busy={overview.isFetching} className="mt-7 grid gap-5 md:grid-cols-2">
                {overview.data.feed.map((item) => (
                  <ResourceCard key={item.id} locale={locale} resource={item.resource} />
                ))}
              </div>
              <nav
                aria-label={String(content.paginationLabel)}
                className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6"
              >
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={pageIndex === 0 || overview.isFetching}
                  onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  {content.previousPage}
                </button>
                <span aria-live="polite" className="text-sm text-ink-tertiary">
                  {content.pagePrefix} {pageIndex + 1} {content.pageSuffix}
                </span>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!overview.data.page.hasMore || overview.isFetching}
                  onClick={goToNextPage}
                  type="button"
                >
                  {content.nextPage}
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </nav>
            </>
          ) : (
            <p className="mt-7 rounded-md border border-dashed border-border p-10 text-center text-ink-tertiary">
              {content.feedEmpty}
            </p>
          )}
        </section>

        <aside className="space-y-9">
          <section>
            <h2 className="m-0 text-xl font-semibold">{content.topicsTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-tertiary">{content.topicsDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {overview.data.topics.map((topic) => (
                <Link
                  className="inline-flex min-h-10 items-center rounded-[var(--ed-radius-pill)] border border-border bg-surface px-3 py-1.5 text-sm no-underline hover:border-border-strong"
                  href={localizedRoute(locale, `/discover?tags=${encodeURIComponent(topic.slug)}`)}
                  key={topic.slug}
                >
                  #{topic.name} <span className="text-ink-tertiary">{topic.resourceCount}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="m-0 text-xl font-semibold">{content.creatorsTitle}</h2>
            <ol className="mt-5 list-none divide-y divide-border p-0">
              {overview.data.activeCreators.map((creator) => (
                <li
                  className="flex items-center justify-between gap-4 py-4 first:pt-0"
                  key={creator.author.id}
                >
                  <div className="min-w-0">
                    <Link
                      className="truncate text-sm font-semibold no-underline hover:text-accent"
                      href={localizedRoute(locale, `/creators/${creator.author.handle}`)}
                    >
                      {creator.author.displayName}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-ink-tertiary">
                      {creator.resourceCount} {content.creatorResources}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-accent">
                    {creator.engagementScore}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="m-0 text-xl font-semibold">{content.leaderboardTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-tertiary">
              {content.leaderboardDescription}
            </p>
            <ol className="mt-5 list-none p-0">
              {leaderboard.data?.items.map((entry) => (
                <li className="flex items-center gap-3 py-2" key={entry.user.id}>
                  <span className="w-5 text-xs font-semibold text-ink-tertiary">{entry.rank}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {entry.user.displayName}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    {entry.points} {content.points}
                  </span>
                </li>
              ))}
            </ol>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent no-underline hover:underline"
              href={localizedRoute(locale, "/achievements")}
            >
              {content.viewAchievements}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

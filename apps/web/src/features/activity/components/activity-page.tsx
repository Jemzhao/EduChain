"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { Button } from "@/components/primitives/button";
import {
  clearBrowsingHistory,
  dismissResourceRecommendation,
} from "@/data-access/mutations/community";
import { getBrowsingHistory, getMyActivity } from "@/data-access/queries/community";
import { listRecommendedResources } from "@/data-access/queries/resources";
import { getCurrentUser } from "@/data-access/queries/user";
import { ResourceCard } from "@/features/resources/components/resource-card";
import { localizedRoute } from "@/lib/routing/localized-route";

type ActivityType = components["schemas"]["ActivityType"];

export function ActivityPage({ locale }: { locale: string }) {
  const content = useIntlayer("activity-page");
  const queryClient = useQueryClient();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const history = useQuery({
    queryKey: ["browsing-history"],
    queryFn: () => getBrowsingHistory(12),
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const activity = useQuery({
    queryKey: ["my-activity"],
    queryFn: () => getMyActivity(20),
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const recommendations = useQuery({
    queryKey: ["resource-recommendations"],
    queryFn: () => listRecommendedResources(6),
    retry: false,
  });
  const clear = useMutation({
    mutationFn: clearBrowsingHistory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["browsing-history"] });
      await queryClient.invalidateQueries({ queryKey: ["resource-recommendations"] });
    },
  });
  const dismissRecommendation = useMutation({
    mutationFn: dismissResourceRecommendation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource-recommendations"] });
    },
  });

  if (currentUser.isPending) {
    return <p className="py-24 text-center text-ink-secondary">{content.loading}</p>;
  }
  if (!currentUser.data) {
    return (
      <div className="py-24 text-center">
        <p className="m-0 text-ink-secondary">{content.authenticationRequired}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signInAction}
        </Link>
      </div>
    );
  }

  const activityLabels: Record<ActivityType, unknown> = {
    VIEWED_RESOURCE: content.viewedResource,
    LIKED_RESOURCE: content.likedResource,
    SAVED_RESOURCE: content.savedResource,
    COMMENTED_RESOURCE: content.commentedResource,
    PUBLISHED_RESOURCE: content.publishedResource,
  };
  const loading = history.isPending || activity.isPending;
  const failed = history.isError || activity.isError;

  return (
    <div>
      <header className="max-w-3xl border-b border-border pb-9">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-secondary">{content.description}</p>
      </header>

      {loading ? (
        <p className="py-20 text-center text-ink-secondary">{content.loading}</p>
      ) : failed ? (
        <p className="py-20 text-center text-danger" role="alert">
          {content.loadError}
        </p>
      ) : (
        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="m-0 flex items-center gap-3 text-2xl font-semibold tracking-[-0.03em]">
                <History aria-hidden="true" className="size-5 text-accent" />
                {content.historyTitle}
              </h2>
              {history.data?.items.length ? (
                <Button
                  disabled={clear.isPending}
                  onClick={() => clear.mutate()}
                  type="button"
                  variant="quiet"
                >
                  {clear.isPending ? content.clearingHistory : content.clearHistory}
                </Button>
              ) : null}
            </div>
            {history.data?.items.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {history.data.items.map((item) => (
                  <div key={item.resource.id}>
                    <ResourceCard locale={locale} resource={item.resource} />
                    <p className="mt-2 mb-0 text-xs text-ink-tertiary">
                      {content.viewedAt} ·{" "}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.viewedAt))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-md border border-dashed border-border p-8 text-center text-sm text-ink-tertiary">
                {content.historyEmpty}
              </p>
            )}
          </section>

          <aside className="rounded-md border border-border bg-surface p-6 lg:sticky lg:top-5 lg:self-start">
            <h2 className="m-0 flex items-center gap-3 text-lg font-semibold">
              <Clock3 aria-hidden="true" className="size-5 text-accent" />
              {content.activityTitle}
            </h2>
            {activity.data?.items.length ? (
              <ol className="mt-5 list-none divide-y divide-border p-0">
                {activity.data.items.map((item) => (
                  <li className="py-4 first:pt-0" key={item.id}>
                    <Link
                      className="text-sm font-semibold text-ink no-underline hover:text-accent"
                      href={localizedRoute(locale, `/resources/${item.resourceId}`)}
                    >
                      {String(activityLabels[item.type])}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-ink-tertiary">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt))}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 text-sm text-ink-tertiary">{content.activityEmpty}</p>
            )}
          </aside>
        </div>
      )}

      {recommendations.data?.items.length ? (
        <section className="border-t border-border py-10">
          <h2 className="m-0 flex items-center gap-3 text-2xl font-semibold tracking-[-0.03em]">
            <Sparkles aria-hidden="true" className="size-5 text-accent" />
            {content.recommendationsTitle}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink-secondary">
            {content.recommendationsDescription}
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.data.items.map((resource) => (
              <div key={resource.id}>
                <ResourceCard locale={locale} resource={resource} />
                <Button
                  className="mt-2"
                  disabled={dismissRecommendation.isPending}
                  onClick={() => dismissRecommendation.mutate(resource.id)}
                  type="button"
                  variant="quiet"
                >
                  {content.recommendationDismiss}
                </Button>
              </div>
            ))}
          </div>
          {dismissRecommendation.isError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {content.recommendationDismissError}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

"use client";

import type { components } from "@educhain/api-contract";
import { useQuery } from "@tanstack/react-query";
import { Award, LockKeyhole, Trophy } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import {
  getAchievementCatalog,
  getContributorLeaderboard,
  getMyAchievementProfile,
} from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type Definition = components["schemas"]["AchievementDefinition"];
type Level = components["schemas"]["AchievementLevel"];

export function AchievementsPage({ locale }: { locale: string }) {
  const content = useIntlayer("achievements-page");
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const catalog = useQuery({ queryKey: ["achievement-catalog"], queryFn: getAchievementCatalog });
  const profile = useQuery({
    queryKey: ["my-achievements"],
    queryFn: getMyAchievementProfile,
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const leaderboard = useQuery({
    queryKey: ["contributor-leaderboard", 20],
    queryFn: () => getContributorLeaderboard(20),
  });

  if (currentUser.isPending || catalog.isPending || leaderboard.isPending) {
    return <p className="py-24 text-center text-ink-secondary">{content.loading}</p>;
  }
  if (!catalog.data || !leaderboard.data) {
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {content.loadError}
      </p>
    );
  }

  const copyFor = (achievement: Definition) => achievementCopy(achievement.id, content);
  const levelFor = (level: Level) => levelCopy(level, content);
  const progressItems =
    profile.data?.items ??
    catalog.data.items.map((achievement) => ({ achievement, current: 0, unlocked: false }));

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

      {currentUser.data && profile.data ? (
        <section className="grid border-b border-border py-9 sm:grid-cols-3">
          <ProgressStat label={content.totalPoints} value={profile.data.totalPoints} />
          <ProgressStat label={content.myProgress} value={levelFor(profile.data.level)} />
          <ProgressStat
            label={content.nextLevel}
            value={profile.data.nextLevelPoints ?? content.highestLevel}
          />
        </section>
      ) : (
        <section className="my-9 flex flex-wrap items-center justify-between gap-6 rounded-md border border-border bg-surface p-7">
          <div>
            <h2 className="m-0 text-xl font-semibold">{content.signInTitle}</h2>
            <p className="mt-2 mb-0 text-sm text-ink-secondary">{content.signInDescription}</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
            href={localizedRoute(locale, "/sign-in")}
          >
            {content.signInAction}
          </Link>
        </section>
      )}

      <section className="py-10">
        <h2 className="m-0 text-3xl font-semibold tracking-[-0.035em]">{content.catalogTitle}</h2>
        <p className="mt-3 max-w-2xl leading-7 text-ink-secondary">{content.catalogDescription}</p>
        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {progressItems.map((item) => {
            const copy = copyFor(item.achievement);
            const ratio = Math.min(100, (item.current / item.achievement.target) * 100);
            return (
              <article
                className="rounded-md border border-border bg-surface p-6"
                key={item.achievement.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex size-10 items-center justify-center rounded-sm ${item.unlocked ? "bg-accent-soft text-accent" : "bg-surface-subtle text-ink-tertiary"}`}
                  >
                    {item.unlocked ? (
                      <Award aria-hidden="true" className="size-5" />
                    ) : (
                      <LockKeyhole aria-hidden="true" className="size-4" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-ink-tertiary">
                    +{item.achievement.points} {content.points}
                  </span>
                </div>
                <h3 className="mt-5 mb-0 text-lg font-semibold">{copy.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-ink-secondary">
                  {copy.description}
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-[var(--ed-radius-pill)] bg-surface-subtle">
                  <div
                    className="h-full rounded-[var(--ed-radius-pill)] bg-accent"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <p className="mt-2 mb-0 text-xs text-ink-tertiary">
                  {content.progress} · {item.current}/{item.achievement.target}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border py-10">
        <h2 className="m-0 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em]">
          <Trophy aria-hidden="true" className="size-6 text-accent" />
          {content.leaderboardTitle}
        </h2>
        <ol className="mt-7 grid list-none gap-3 p-0 md:hidden">
          {leaderboard.data.items.map((entry) => (
            <li className="rounded-md border border-border bg-surface p-4" key={entry.user.id}>
              <div className="flex items-start gap-3 border-b border-border pb-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {entry.rank}
                </span>
                <div className="min-w-0">
                  <Link
                    className="inline-flex min-h-8 items-center font-semibold no-underline hover:text-accent"
                    href={localizedRoute(locale, `/creators/${entry.user.handle}`)}
                  >
                    {entry.user.displayName}
                  </Link>
                  <p className="mb-0 text-xs text-ink-tertiary">{levelFor(entry.level)}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <LeaderboardStat label={content.publications} value={entry.publishedResources} />
                <LeaderboardStat label={content.receivedLikes} value={entry.receivedLikes} />
                <LeaderboardStat label={content.points} value={entry.points} />
              </dl>
            </li>
          ))}
        </ol>
        <div className="mt-7 hidden overflow-x-auto rounded-md border border-border bg-surface md:block">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead className="bg-surface-subtle text-xs text-ink-tertiary">
              <tr>
                <th className="px-5 py-3 font-semibold">{content.rank}</th>
                <th className="px-5 py-3 font-semibold">{content.contributor}</th>
                <th className="px-5 py-3 font-semibold">{content.publications}</th>
                <th className="px-5 py-3 font-semibold">{content.receivedLikes}</th>
                <th className="px-5 py-3 text-right font-semibold">{content.points}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.data.items.map((entry) => (
                <tr key={entry.user.id}>
                  <td className="px-5 py-4 font-semibold text-ink-tertiary">{entry.rank}</td>
                  <td className="px-5 py-4">
                    <Link
                      className="font-semibold no-underline hover:text-accent"
                      href={localizedRoute(locale, `/creators/${entry.user.handle}`)}
                    >
                      {entry.user.displayName}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-ink-tertiary">{levelFor(entry.level)}</p>
                  </td>
                  <td className="px-5 py-4">{entry.publishedResources}</td>
                  <td className="px-5 py-4">{entry.receivedLikes}</td>
                  <td className="px-5 py-4 text-right font-semibold">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProgressStat({ label, value }: { label: unknown; value: unknown }) {
  return (
    <div className="border-border py-4 sm:border-r sm:px-7 first:pl-0 last:border-r-0">
      <p className="m-0 text-sm text-ink-tertiary">{String(label)}</p>
      <p className="mt-2 mb-0 text-2xl font-semibold tracking-[-0.03em]">{String(value)}</p>
    </div>
  );
}

function LeaderboardStat({ label, value }: { label: unknown; value: unknown }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-5 text-ink-tertiary">{String(label)}</dt>
      <dd className="mt-1 ml-0 font-semibold">{String(value)}</dd>
    </div>
  );
}

function achievementCopy(id: string, content: ReturnType<typeof useIntlayer>) {
  const copies = {
    "first-publication": {
      title: content.firstPublicationTitle,
      description: content.firstPublicationDescription,
    },
    "knowledge-builder": {
      title: content.knowledgeBuilderTitle,
      description: content.knowledgeBuilderDescription,
    },
    "community-voice": {
      title: content.communityVoiceTitle,
      description: content.communityVoiceDescription,
    },
    appreciated: { title: content.appreciatedTitle, description: content.appreciatedDescription },
    "trusted-creator": {
      title: content.trustedCreatorTitle,
      description: content.trustedCreatorDescription,
    },
    "curious-reader": {
      title: content.curiousReaderTitle,
      description: content.curiousReaderDescription,
    },
  };
  return copies[id as keyof typeof copies] ?? { title: id, description: "" };
}

function levelCopy(level: Level, content: ReturnType<typeof useIntlayer>) {
  return {
    LEARNER: content.levelLearner,
    CONTRIBUTOR: content.levelContributor,
    CURATOR: content.levelCurator,
    SCHOLAR: content.levelScholar,
    MENTOR: content.levelMentor,
  }[level];
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GraduationCap, Mail, MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import { useIntlayer } from "next-intlayer";

import { getPublicUser } from "@/data-access/queries/user";
import { FollowButton } from "@/features/interactions/components/follow-button";
import { FollowLists } from "@/features/profile/components/follow-lists";

export function PublicProfile({ handle, locale }: { handle: string; locale: string }) {
  const content = useIntlayer("profile-page");
  const profile = useQuery({
    queryKey: ["public-user", handle],
    queryFn: () => getPublicUser(handle),
    retry: false,
  });

  if (profile.isPending)
    return (
      <p className="py-20 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  if (!profile.data)
    return (
      <p className="py-20 text-center text-danger" role="alert">
        {content.notFound}
      </p>
    );

  const { user, statistics } = profile.data;
  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-md border border-border bg-surface">
      <div className="h-2 bg-accent" />
      <div className="p-7 sm:p-12">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.publicProfileEyebrow}
        </p>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--ed-radius-pill)] bg-accent-soft text-accent sm:size-24">
              {user.avatarUrl ? (
                <Image
                  alt=""
                  className="size-full object-cover"
                  height={96}
                  src={user.avatarUrl}
                  unoptimized
                  width={96}
                />
              ) : (
                <UserRound aria-hidden="true" className="size-9" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {user.displayName}
              </h1>
              <p className="mt-2 mb-0 font-mono text-sm text-ink-tertiary">@{user.handle}</p>
            </div>
          </div>
          <FollowButton handle={user.handle} locale={locale} userId={user.id} />
        </div>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-secondary">
          {profile.data.profile.bio || content.bioEmpty}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-secondary">
          <p className="m-0 flex items-center gap-2">
            <GraduationCap aria-hidden="true" className="size-4" />
            {profile.data.profile.education || content.educationEmpty}
          </p>
          {profile.data.profile.location ? (
            <p className="m-0 flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4" />
              {profile.data.profile.location}
            </p>
          ) : null}
          {profile.data.profile.websiteUrl ? (
            <a
              className="flex items-center gap-2 text-accent underline-offset-4 hover:underline"
              href={profile.data.profile.websiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              {content.websiteLabel}
            </a>
          ) : null}
          {profile.data.profile.contactEmail ? (
            <a
              className="flex items-center gap-2 text-accent underline-offset-4 hover:underline"
              href={`mailto:${profile.data.profile.contactEmail}`}
            >
              <Mail aria-hidden="true" className="size-4" />
              {profile.data.profile.contactEmail}
            </a>
          ) : null}
        </div>
        <dl className="mt-10 grid grid-cols-3 border-y border-border py-6">
          {[
            [content.publishedResources, statistics.publishedResources],
            [content.followers, statistics.followers],
            [content.following, statistics.following],
          ].map(([label, value]) => (
            <div className="px-2 text-center first:pl-0 last:pr-0" key={String(label)}>
              <dd className="m-0 text-2xl font-semibold tracking-[-0.03em]">{value}</dd>
              <dt className="mt-1 text-xs text-ink-tertiary sm:text-sm">{label}</dt>
            </div>
          ))}
        </dl>
        <FollowLists locale={locale} userId={user.id} />
      </div>
    </article>
  );
}

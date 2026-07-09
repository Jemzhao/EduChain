"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Download, FileText, Share2 } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useEffect, useState } from "react";

import { ApiError } from "@/data-access/http/api-error";
import { recordResourceView } from "@/data-access/mutations/community";
import {
  getResource,
  getResourceStatistics,
  listResourceVersions,
} from "@/data-access/queries/resources";
import { EvidenceCard } from "@/features/evidence/components/evidence-card";
import { CommentSection } from "@/features/interactions/components/comment-section";
import { ResourceActions } from "@/features/interactions/components/resource-actions";
import { localizedRoute } from "@/lib/routing/localized-route";
import { categoryName } from "@/features/taxonomy/category-copy";

import { MarkdownArticle } from "./markdown-article";

export function ResourceDetail({ locale, resourceKey }: { locale: string; resourceKey: string }) {
  const content = useIntlayer("resources");
  const taxonomy = useIntlayer("taxonomy");
  const [shared, setShared] = useState(false);
  const resourceQuery = useQuery({
    queryKey: ["resource", resourceKey],
    queryFn: () => getResource(resourceKey),
    retry: false,
  });
  const versions = useQuery({
    queryKey: ["resource-versions", resourceQuery.data?.id],
    queryFn: () => listResourceVersions(resourceQuery.data!.id),
    enabled: Boolean(resourceQuery.data?.id),
    retry: false,
  });
  const statistics = useQuery({
    queryKey: ["resource-statistics", resourceQuery.data?.id],
    queryFn: () => getResourceStatistics(resourceQuery.data!.id),
    enabled: Boolean(resourceQuery.data?.id),
    retry: false,
  });

  useEffect(() => {
    const resourceId = resourceQuery.data?.id;
    if (!resourceId) return;
    const storageKey = "educhain.viewer-key";
    let viewerKey = window.sessionStorage.getItem(storageKey);
    if (!viewerKey) {
      viewerKey = crypto.randomUUID();
      window.sessionStorage.setItem(storageKey, viewerKey);
    }
    void recordResourceView(resourceId, viewerKey);
  }, [resourceQuery.data?.id]);

  if (resourceQuery.isPending) {
    return (
      <p className="py-24 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }
  if (!resourceQuery.data) {
    const withdrawn =
      resourceQuery.error instanceof ApiError && resourceQuery.error.problem.status === 410;
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {withdrawn ? content.resourceWithdrawn : content.resourceNotFound}
      </p>
    );
  }

  const resource = resourceQuery.data;
  const published = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(resource.publishedAt),
  );
  const typeLabel = {
    ARTICLE: content.typeArticle,
    DOCUMENT: content.typeDocument,
    VIDEO: content.typeVideo,
    LINK: content.typeLink,
  }[resource.resourceType];

  return (
    <article>
      <header className="border-b border-border py-14 sm:py-20">
        <div className="mx-auto max-w-[var(--ed-content-reading)]">
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-tertiary">
            <span className="rounded-[var(--ed-radius-pill)] bg-accent-soft px-3 py-1 font-medium text-accent">
              {categoryName(taxonomy, resource.category.slug, resource.category.nameKey)}
            </span>
            <span>{typeLabel}</span>
            <span>
              {resource.readingMinutes} {content.readingMinutes}
            </span>
            {statistics.data ? (
              <span>
                {statistics.data.views} {content.viewsLabel}
              </span>
            ) : null}
          </div>
          <h1 className="mt-7 mb-0 text-4xl leading-tight font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
            {resource.title}
          </h1>
          <p className="mt-6 text-xl leading-8 text-ink-secondary">{resource.summary}</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-6">
            <div>
              <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                {content.creatorLabel}
              </p>
              <Link
                className="mt-1 inline-block font-semibold no-underline hover:text-accent"
                href={localizedRoute(locale, `/creators/${resource.author.handle}`)}
              >
                {resource.author.displayName}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="m-0 text-sm text-ink-tertiary">
                {content.publishedLabel} · {published}
              </p>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm font-semibold text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: resource.title, url: window.location.href });
                      return;
                    } catch {
                      return;
                    }
                  }
                  await navigator.clipboard.writeText(window.location.href);
                  setShared(true);
                  window.setTimeout(() => setShared(false), 1800);
                }}
                type="button"
              >
                <Share2 aria-hidden="true" className="size-4" />
                {shared ? content.sharedAction : content.shareAction}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 py-14 lg:grid-cols-[minmax(0,var(--ed-content-reading))_17rem] lg:items-start lg:py-20">
        <div>
          {resource.sourceUrl ? (
            <section className="mb-10 rounded-md border border-accent/20 bg-accent-soft p-6">
              <p className="m-0 text-sm leading-6 text-ink-secondary">{content.sourceNotice}</p>
              <a
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm bg-accent px-4 text-sm font-semibold text-white no-underline"
                href={resource.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {content.openSourceAction}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </section>
          ) : null}
          <MarkdownArticle body={resource.body} />
          <section className="mt-14 border-t border-border pt-8">
            <h2 className="m-0 text-lg font-semibold">{content.attachmentsLabel}</h2>
            {resource.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{content.noAttachments}</p>
            ) : (
              <ul className="mt-4 list-none space-y-3 p-0">
                {resource.attachments.map((file) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-sm border border-border p-4"
                    key={file.fileId}
                  >
                    <FileText aria-hidden="true" className="size-5 text-accent" />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-medium">{file.displayName}</p>
                      <p className="mt-1 mb-0 text-xs text-ink-tertiary">
                        {file.mediaType} · {Math.ceil(file.size / 1024)} KB
                      </p>
                    </div>
                    <a
                      className="relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm px-3 text-sm font-semibold text-accent no-underline hover:bg-accent-soft"
                      download={file.displayName}
                      href={`/api/v1/files/${file.fileId}/content`}
                    >
                      <Download aria-hidden="true" className="size-4" />
                      {content.downloadAttachment}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="mt-8">
            <ResourceActions locale={locale} resourceId={resource.id} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <EvidenceCard
            contentDigest={resource.contentDigest}
            locale={locale}
            resourceId={resource.id}
            versionNumber={resource.versionNumber}
          />
          <section className="rounded-md bg-surface-subtle p-5">
            <h2 className="m-0 text-sm font-semibold">{content.copyrightLabel}</h2>
            <p className="mt-2 mb-0 text-sm leading-6 text-ink-secondary">
              {resource.copyrightStatement}
            </p>
          </section>
          {versions.data && versions.data.items.length > 0 ? (
            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="m-0 text-sm font-semibold">{content.versionHistoryTitle}</h2>
              <p className="mt-2 text-xs leading-5 text-ink-tertiary">
                {content.versionHistoryDescription}
              </p>
              <ol className="mt-4 list-none divide-y divide-border p-0">
                {versions.data.items.map((version) => (
                  <li className="flex items-center justify-between gap-3 py-3" key={version.id}>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold">v{version.versionNumber}</p>
                      <p className="mt-1 mb-0 text-xs text-ink-tertiary">
                        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                          new Date(version.publishedAt),
                        )}
                      </p>
                    </div>
                    {version.current ? (
                      <span className="rounded-[var(--ed-radius-pill)] bg-success-soft px-2 py-1 text-xs font-semibold text-success">
                        {content.currentVersionLabel}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                className="rounded-[var(--ed-radius-pill)] border border-border px-3 py-1 text-xs text-ink-secondary"
                key={tag.id}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </aside>
      </div>
      <CommentSection locale={locale} resourceId={resource.id} />
    </article>
  );
}

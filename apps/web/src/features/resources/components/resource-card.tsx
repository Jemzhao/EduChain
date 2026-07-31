"use client";

import type { components } from "@educhain/api-contract";
import { ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { resourceRoute } from "@/lib/routing/localized-route";
import { categoryName } from "@/features/taxonomy/category-copy";

type ResourceCardData = components["schemas"]["ResourceCard"];

export function ResourceCard({ locale, resource }: { locale: string; resource: ResourceCardData }) {
  const content = useIntlayer("resources");
  const taxonomy = useIntlayer("taxonomy");
  const typeLabel = {
    ARTICLE: content.typeArticle,
    DOCUMENT: content.typeDocument,
    VIDEO: content.typeVideo,
    LINK: content.typeLink,
  }[resource.resourceType];
  const evidenceLabel =
    resource.evidenceStatus === "CONFIRMED"
      ? content.evidenceConfirmed
      : resource.evidenceStatus === "FAILED" || resource.evidenceStatus === "TERMINATED"
        ? content.evidenceFailed
        : content.evidencePending;

  return (
    <article className="group relative flex h-full flex-col rounded-md border border-border bg-surface p-6 transition-[border-color,transform] duration-[var(--ed-duration-layout)] hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-tertiary">
        <span className="rounded-[var(--ed-radius-pill)] bg-accent-soft px-2.5 py-1 text-accent">
          {categoryName(taxonomy, resource.category.slug, resource.category.nameKey)}
        </span>
        <span>{typeLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {resource.readingMinutes} {content.readingMinutes}
        </span>
      </div>
      <h2 className="mt-5 mb-0 text-xl leading-snug font-semibold tracking-[-0.025em]">
        <Link
          className="no-underline after:absolute after:inset-0"
          href={resourceRoute(locale, resource.slug)}
        >
          {resource.title}
        </Link>
      </h2>
      <p className="mt-3 line-clamp-3 flex-1 leading-7 text-ink-secondary">{resource.summary}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {resource.tags.slice(0, 3).map((tag) => (
          <span className="text-xs text-ink-tertiary" key={tag.id}>
            #{tag.name}
          </span>
        ))}
      </div>
      <div className="relative mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-medium">{resource.author.displayName}</p>
          <p className="mt-0.5 mb-0 inline-flex items-center gap-1.5 text-xs text-ink-tertiary">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            {evidenceLabel}
          </p>
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </article>
  );
}

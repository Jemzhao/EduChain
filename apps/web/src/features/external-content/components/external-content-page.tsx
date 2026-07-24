"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { getExternalContent } from "@/data-access/queries/external-content";

export function ExternalContentPage() {
  const content = useIntlayer("external-content");
  const { locale } = useLocale();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const results = useQuery({
    queryKey: ["external-content", query],
    queryFn: () => getExternalContent(query),
    retry: false,
  });
  return (
    <div>
      <div className="max-w-3xl">
        <p className="m-0 text-xs font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 mb-0 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 mb-0 text-base leading-7 text-ink-secondary">{content.description}</p>
      </div>
      <form
        className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(input.trim());
        }}
      >
        <label className="sr-only" htmlFor="external-search">
          {content.searchLabel}
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-tertiary"
          />
          <input
            className="min-h-12 w-full rounded-sm border border-border bg-surface pr-4 pl-11"
            id="external-search"
            maxLength={120}
            onChange={(event) => setInput(event.target.value)}
            placeholder={String(content.searchPlaceholder)}
            value={input}
          />
        </div>
        <Button type="submit">{content.searchAction}</Button>
      </form>
      <aside className="mt-8 flex max-w-4xl items-start gap-3 rounded-md bg-accent-soft p-5 text-sm leading-6 text-ink-secondary">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="m-0">{content.boundary}</p>
      </aside>
      <section className="mt-12">
        <h2 className="m-0 text-xl font-semibold">{content.results}</h2>
        {results.isPending ? (
          <p className="mt-6 text-sm text-ink-tertiary">{content.loading}</p>
        ) : null}
        {results.isError ? (
          <p className="mt-6 text-sm text-danger" role="alert">
            {content.loadFailed}
          </p>
        ) : null}
        {results.data?.items.length === 0 ? (
          <p className="mt-6 text-sm text-ink-tertiary">{content.empty}</p>
        ) : null}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {results.data?.items.map((item) => (
            <article className="rounded-md border border-border bg-surface p-6" key={item.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-tertiary">
                <span>
                  {content.source}: {item.sourceName}
                </span>
                <span>·</span>
                <span>
                  {content.author}: {item.authorName}
                </span>
              </div>
              <h3 className="mt-4 mb-0 text-xl font-semibold tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-3 mb-0 text-sm leading-6 text-ink-secondary">{item.summary}</p>
              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-xs text-ink-tertiary">
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(item.publishedAt ?? item.fetchedAt),
                  )}
                </span>
                <a
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent no-underline hover:underline"
                  href={item.canonicalUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {content.openOriginal}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

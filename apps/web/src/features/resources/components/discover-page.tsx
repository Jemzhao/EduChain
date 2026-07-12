"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Flame, Search, SlidersHorizontal, X } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/primitives/button";
import { clearSearchHistory, deleteSearchHistoryItem } from "@/data-access/mutations/community";
import {
  getPopularSearchKeywords,
  getSearchHistory,
  getSearchSuggestions,
  searchResources,
} from "@/data-access/queries/resources";
import { getCategories } from "@/data-access/queries/taxonomy";
import { getCurrentUser } from "@/data-access/queries/user";
import { categoryName } from "@/features/taxonomy/category-copy";

import { ResourceCard } from "./resource-card";

type ResourceSort = components["schemas"]["ResourceSort"];
type RankingSignal = components["schemas"]["SearchRankingSignal"];

export function DiscoverPage({
  locale,
  initialCategory,
}: {
  locale: string;
  initialCategory?: string;
}) {
  const content = useIntlayer("resources");
  const taxonomy = useIntlayer("taxonomy");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? initialCategory ?? "";
  const sort = (searchParams.get("sort") ?? "RELEVANCE") as ResourceSort;
  const [input, setInput] = useState(query);

  const currentUser = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser });
  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const suggestions = useQuery({
    queryKey: ["search", "suggestions", input.trim()],
    queryFn: () => getSearchSuggestions(input.trim()),
    enabled: input.trim().length >= 2 && input.trim() !== query,
    staleTime: 30_000,
  });
  const popularSearches = useQuery({
    queryKey: ["search", "popular-keywords"],
    queryFn: () => getPopularSearchKeywords(8),
    staleTime: 60_000,
  });
  const searchHistory = useQuery({
    queryKey: ["search", "history"],
    queryFn: () => getSearchHistory(8),
    enabled: Boolean(currentUser.data),
  });
  const results = useQuery({
    queryKey: ["search", "resources", query, category, sort],
    queryFn: () =>
      searchResources({
        query,
        category: category || undefined,
        sort,
        limit: 24,
      }),
  });

  useEffect(() => {
    if (!currentUser.data || !query || !results.isSuccess) return;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
      queryClient.invalidateQueries({ queryKey: ["search", "popular-keywords"] }),
    ]);
  }, [currentUser.data, query, queryClient, results.dataUpdatedAt, results.isSuccess]);

  const updateUrl = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    router.push(`${pathname}${next.size > 0 ? `?${next}` : ""}` as Route);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateUrl({ q: input.trim() });
  };

  const clearHistory = useMutation({
    mutationFn: clearSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
  });
  const removeHistoryItem = useMutation({
    mutationFn: deleteSearchHistoryItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search", "history"] }),
  });

  const chooseSearch = (value: string) => {
    setInput(value);
    updateUrl({ q: value });
  };

  return (
    <>
      <section className="border-b border-border py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
            {content.discoverEyebrow}
          </p>
          <h1 className="mt-5 mb-0 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            {content.discoverTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-secondary">
            {content.discoverDescription}
          </p>
        </div>
        <form
          className="mt-9 flex max-w-3xl flex-col gap-3 sm:flex-row"
          onSubmit={submit}
          role="search"
        >
          <label className="sr-only" htmlFor="resource-search">
            {content.searchLabel}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-tertiary"
            />
            <input
              className="min-h-13 w-full rounded-sm border border-border bg-surface pr-4 pl-12 text-base outline-none placeholder:text-ink-tertiary hover:border-border-strong focus:border-accent"
              id="resource-search"
              onChange={(event) => setInput(event.target.value)}
              placeholder={String(content.searchPlaceholder)}
              type="search"
              value={input}
            />
            {suggestions.data?.items.length ? (
              <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-20 overflow-hidden rounded-md border border-border bg-surface p-2 shadow-xl shadow-black/8">
                <p className="m-0 px-3 py-2 text-xs font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
                  {content.suggestionsLabel}
                </p>
                {suggestions.data.items.map((suggestion) => (
                  <button
                    className="flex min-h-10 w-full items-center gap-3 rounded-sm border-0 bg-transparent px-3 text-left text-sm text-ink hover:bg-surface-muted"
                    key={suggestion}
                    onClick={() => chooseSearch(suggestion)}
                    type="button"
                  >
                    <Search aria-hidden="true" className="size-4 text-ink-tertiary" />
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button className="min-h-13 px-7" type="submit">
            {content.searchAction}
          </Button>
        </form>
        <div className="mt-6 grid max-w-4xl gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
              <Flame aria-hidden="true" className="size-4 text-accent" />
              {content.popularSearches}
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.data?.items.map((item) => (
                <button
                  className="min-h-9 rounded-full border border-border bg-surface px-3 text-sm text-ink-secondary hover:border-border-strong hover:text-ink"
                  key={item.query}
                  onClick={() => chooseSearch(item.query)}
                  type="button"
                >
                  {item.query}
                  <span className="ml-2 text-xs text-ink-tertiary">
                    {item.searchCount} {content.searchCountLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {searchHistory.data?.items.length ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="m-0 flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
                  <Clock3 aria-hidden="true" className="size-4" />
                  {content.recentSearches}
                </p>
                <button
                  className="border-0 bg-transparent text-xs font-medium text-ink-tertiary hover:text-danger disabled:opacity-50"
                  disabled={clearHistory.isPending}
                  onClick={() => clearHistory.mutate()}
                  type="button"
                >
                  {content.clearSearchHistory}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.data.items.map((item) => (
                  <span
                    className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface pl-3 text-sm text-ink-secondary"
                    key={item.id}
                  >
                    <button
                      className="border-0 bg-transparent p-0 text-inherit"
                      onClick={() => chooseSearch(item.query)}
                      type="button"
                    >
                      {item.query}
                    </button>
                    <button
                      aria-label={String(content.removeSearchHistory)}
                      className="ml-1 inline-flex size-8 items-center justify-center rounded-full border-0 bg-transparent text-ink-tertiary hover:bg-surface-muted hover:text-danger"
                      disabled={removeHistoryItem.isPending}
                      onClick={() => removeHistoryItem.mutate(item.id)}
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {clearHistory.isError || removeHistoryItem.isError ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {content.searchHistoryError}
          </p>
        ) : null}
      </section>

      <section className="py-10 sm:py-14">
        <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="block text-xs font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
              {content.categoryLabel}
              <select
                className="mt-2 block min-h-11 rounded-sm border border-border bg-surface px-3 text-sm font-medium text-ink"
                onChange={(event) => updateUrl({ category: event.target.value })}
                value={category}
              >
                <option value="">{content.allCategories}</option>
                {categories.data?.items.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {categoryName(taxonomy, item.slug, item.nameKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold tracking-[0.06em] text-ink-tertiary uppercase">
              {content.sortLabel}
              <select
                className="mt-2 block min-h-11 rounded-sm border border-border bg-surface px-3 text-sm font-medium text-ink"
                onChange={(event) => updateUrl({ sort: event.target.value })}
                value={sort}
              >
                <option value="RELEVANCE">{content.sortRelevance}</option>
                <option value="NEWEST">{content.sortNewest}</option>
                <option value="QUALITY">{content.sortQuality}</option>
                <option value="POPULAR">{content.sortPopular}</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            {query || category || sort !== "RELEVANCE" ? (
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-sm border-0 bg-transparent px-2 text-sm font-medium text-ink-secondary hover:text-ink"
                onClick={() => updateUrl({ q: "", category: "", sort: "" })}
                type="button"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                {content.clearFilters}
              </button>
            ) : null}
            <p className="m-0 text-sm text-ink-tertiary">
              {results.data?.items.length ?? 0} {content.resultCount}
            </p>
          </div>
        </div>

        {results.isPending ? (
          <p className="py-24 text-center text-ink-secondary" aria-live="polite">
            {content.loading}
          </p>
        ) : null}
        {results.isError ? (
          <p className="py-24 text-center text-danger" role="alert">
            {content.loadError}
          </p>
        ) : null}
        {results.data?.items.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="m-0 text-2xl font-semibold tracking-[-0.025em]">{content.emptyTitle}</h2>
            <p className="mt-3 text-ink-secondary">{content.emptyDescription}</p>
          </div>
        ) : null}
        {results.data && results.data.items.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.data.items.map((item) => (
              <div className="flex flex-col gap-3" key={item.resource.id}>
                <ResourceCard locale={locale} resource={item.resource} />
                <p className="m-0 px-1 text-xs leading-5 text-ink-tertiary">
                  {content.matchedBy}:{" "}
                  {item.rankingSignals
                    .slice(0, 3)
                    .map((signal) => signalLabel(content, signal))
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

function signalLabel(
  content: {
    signalTitle: unknown;
    signalSummary: unknown;
    signalBody: unknown;
    signalAuthor: unknown;
    signalCategory: unknown;
    signalTag: unknown;
    signalQuality: unknown;
    signalFreshness: unknown;
    signalPopularity: unknown;
  },
  signal: RankingSignal,
) {
  const labels: Record<RankingSignal, unknown> = {
    TITLE_MATCH: content.signalTitle,
    SUMMARY_MATCH: content.signalSummary,
    BODY_MATCH: content.signalBody,
    AUTHOR_MATCH: content.signalAuthor,
    CATEGORY_MATCH: content.signalCategory,
    TAG_MATCH: content.signalTag,
    QUALITY: content.signalQuality,
    FRESHNESS: content.signalFreshness,
    POPULARITY: content.signalPopularity,
  };
  return String(labels[signal]);
}

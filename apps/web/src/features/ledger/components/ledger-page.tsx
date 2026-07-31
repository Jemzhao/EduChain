"use client";

import { useQuery } from "@tanstack/react-query";
import { Blocks, Search } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { FormEvent, useState } from "react";

import { listLedgerBlocks, searchLedger } from "@/data-access/queries/evidence";
import {
  evidenceRoute,
  ledgerBlockRoute,
  ledgerTransactionRoute,
} from "@/lib/routing/localized-route";

export function LedgerPage({ locale }: { locale: string }) {
  const content = useIntlayer("ledger-page");
  const [searchValue, setSearchValue] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [invalid, setInvalid] = useState(false);
  const blocks = useQuery({ queryKey: ["ledger-blocks"], queryFn: () => listLedgerBlocks(30) });
  const searchResults = useQuery({
    queryKey: ["ledger-search", submittedSearch],
    queryFn: () => searchLedger(submittedSearch, 20),
    enabled: Boolean(submittedSearch),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) {
      setInvalid(true);
      return;
    }
    setSubmittedSearch(value);
  };

  return (
    <div>
      <header className="max-w-4xl border-b border-border pb-10">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-secondary">{content.description}</p>
        <p className="mt-5 rounded-sm border-l-2 border-accent bg-accent-soft/40 px-4 py-3 text-sm leading-6 text-ink-secondary">
          {content.scopeNotice}
        </p>
      </header>

      <form className="my-9 max-w-3xl" onSubmit={submit}>
        <label className="text-sm font-semibold" htmlFor="ledger-transaction-search">
          {content.searchLabel}
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            aria-invalid={invalid}
            className="min-h-12 min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-4 font-mono text-sm outline-none focus:border-accent"
            id="ledger-transaction-search"
            onChange={(event) => {
              setSearchValue(event.target.value);
              setInvalid(false);
            }}
            placeholder={String(content.searchPlaceholder)}
            value={searchValue}
          />
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border-0 bg-accent px-5 text-sm font-semibold text-white"
            type="submit"
          >
            <Search aria-hidden="true" className="size-4" />
            {content.searchAction}
          </button>
        </div>
        {invalid ? (
          <p className="mt-2 mb-0 text-sm text-danger" role="alert">
            {content.invalidSearch}
          </p>
        ) : null}
      </form>

      {submittedSearch ? (
        <section className="mb-9 rounded-md border border-border bg-surface p-5">
          <h2 className="m-0 text-xl font-semibold">{content.searchResults}</h2>
          {searchResults.isPending ? (
            <p className="mt-4 mb-0 text-sm text-ink-secondary">{content.loading}</p>
          ) : searchResults.data?.items.length ? (
            <ul className="mt-4 mb-0 divide-y divide-border p-0">
              {searchResults.data.items.map((item) => {
                const href = ledgerSearchRoute(locale, item);
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                    key={`${item.kind}:${item.proofId}:${item.transactionId}`}
                  >
                    <div>
                      <p className="m-0 text-sm font-semibold">
                        {searchKind(item.kind, content)} · {sourceName(item.backend!, content)}
                      </p>
                      <p className="mt-1 mb-0 max-w-2xl truncate font-mono text-xs text-ink-tertiary">
                        {searchResultIdentifier(item)}
                      </p>
                    </div>
                    {href ? (
                      <Link
                        className="text-sm font-semibold text-accent no-underline hover:underline"
                        href={href}
                      >
                        {content.openResult}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 mb-0 text-sm text-ink-tertiary">{content.notFound}</p>
          )}
        </section>
      ) : null}

      <section className="border-t border-border py-9">
        <h2 className="m-0 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em]">
          <Blocks aria-hidden="true" className="size-6 text-accent" />
          {content.recentBlocks}
        </h2>
        {blocks.isPending ? (
          <p className="py-16 text-center text-ink-secondary">{content.loading}</p>
        ) : !blocks.data ? (
          <p className="py-16 text-center text-danger" role="alert">
            {content.loadError}
          </p>
        ) : blocks.data.items.length === 0 ? (
          <p className="py-16 text-center text-ink-tertiary">{content.notFound}</p>
        ) : (
          <div className="mt-7 overflow-x-auto rounded-md border border-border bg-surface">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead className="bg-surface-subtle text-xs text-ink-tertiary">
                <tr>
                  <th className="px-5 py-3">{content.blockHeight}</th>
                  <th className="px-5 py-3">{content.backend}</th>
                  <th className="px-5 py-3">{content.network}</th>
                  <th className="px-5 py-3">{content.blockHash}</th>
                  <th className="px-5 py-3 text-right">{content.transactions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.data.items.map((block) => (
                  <tr key={`${block.backend}:${block.networkId}:${block.blockHeight}`}>
                    <td className="px-5 py-4 font-semibold">
                      <Link
                        className="text-accent no-underline hover:underline"
                        href={blockRoute(locale, block.backend, block.networkId, block.blockHeight)}
                      >
                        #{block.blockHeight}
                      </Link>
                    </td>
                    <td className="px-5 py-4">{sourceName(block.backend, content)}</td>
                    <td className="px-5 py-4 font-mono text-xs">{block.networkId}</td>
                    <td className="max-w-64 truncate px-5 py-4 font-mono text-xs">
                      {block.blockHash}
                    </td>
                    <td className="px-5 py-4 text-right">{block.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ledgerSearchRoute(
  locale: string,
  item: {
    kind: "PROOF" | "TRANSACTION" | "BLOCK" | "DIGEST";
    proofId: string | null;
    transactionId: string | null;
    backend: "SIMULATOR" | "CHAINMAKER" | null;
    networkId: string | null;
    blockHeight: number | null;
  },
) {
  if (item.kind === "BLOCK" && item.backend && item.networkId && item.blockHeight != null) {
    return blockRoute(locale, item.backend, item.networkId, item.blockHeight);
  }
  if (item.kind === "TRANSACTION" && item.transactionId) {
    return ledgerTransactionRoute(locale, item.transactionId);
  }
  return item.proofId ? evidenceRoute(locale, item.proofId) : undefined;
}

function searchKind(kind: string, content: ReturnType<typeof useIntlayer>) {
  return {
    PROOF: content.kindProof,
    TRANSACTION: content.kindTransaction,
    BLOCK: content.kindBlock,
    DIGEST: content.kindDigest,
  }[kind];
}

function searchResultIdentifier(item: {
  kind: "PROOF" | "TRANSACTION" | "BLOCK" | "DIGEST";
  proofId: string | null;
  transactionId: string | null;
  networkId: string | null;
  blockHeight: number | null;
  contentDigest: string | null;
}) {
  if (item.kind === "BLOCK") {
    return `${item.networkId ?? "—"} · #${item.blockHeight ?? "—"}`;
  }
  if (item.kind === "TRANSACTION") return item.transactionId ?? "—";
  if (item.kind === "PROOF") return item.proofId ?? "—";
  return item.contentDigest ?? "—";
}

export function blockRoute(locale: string, backend: string, networkId: string, height: number) {
  return ledgerBlockRoute(locale, backend, networkId, height);
}

export function sourceName(
  backend: "SIMULATOR" | "CHAINMAKER",
  content: ReturnType<typeof useIntlayer>,
) {
  return backend === "SIMULATOR" ? content.sourceSimulator : content.sourceChainMaker;
}

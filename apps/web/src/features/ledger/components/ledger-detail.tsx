"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { getLedgerBlock, getLedgerTransaction } from "@/data-access/queries/evidence";
import { blockRoute, sourceName } from "@/features/ledger/components/ledger-page";
import { localizedRoute } from "@/lib/routing/localized-route";

export function LedgerBlockDetail({
  locale,
  backend,
  networkId,
  blockHeight,
}: {
  locale: string;
  backend: "SIMULATOR" | "CHAINMAKER";
  networkId: string;
  blockHeight: number;
}) {
  const content = useIntlayer("ledger-page");
  const block = useQuery({
    queryKey: ["ledger-block", backend, networkId, blockHeight],
    queryFn: () => getLedgerBlock(backend, networkId, blockHeight),
    retry: false,
  });
  if (block.isPending) return <Loading />;
  if (!block.data) return <Missing />;
  return (
    <DetailShell locale={locale} title={content.blockTitle}>
      {backend === "SIMULATOR" ? <Warning /> : null}
      <FactGrid
        facts={[
          [content.backend, sourceName(backend, content)],
          [content.network, networkId],
          [content.blockHeight, blockHeight],
          [content.blockHash, block.data.block.blockHash],
          [content.confirmed, formatDate(locale, block.data.block.confirmedAt)],
        ]}
      />
      <section className="mt-10 border-t border-border pt-8">
        <h2 className="m-0 text-2xl font-semibold">{content.transactions}</h2>
        <div className="mt-5 space-y-3">
          {block.data.transactions.map((transaction) => (
            <Link
              className="block truncate rounded-sm border border-border bg-surface p-4 font-mono text-sm no-underline hover:border-border-strong"
              href={localizedRoute(
                locale,
                `/ledger/transactions/${encodeURIComponent(transaction.transactionId)}`,
              )}
              key={transaction.transactionId}
            >
              {transaction.transactionId}
            </Link>
          ))}
        </div>
      </section>
    </DetailShell>
  );
}

export function LedgerTransactionDetail({
  locale,
  transactionId,
}: {
  locale: string;
  transactionId: string;
}) {
  const content = useIntlayer("ledger-page");
  const transaction = useQuery({
    queryKey: ["ledger-transaction", transactionId],
    queryFn: () => getLedgerTransaction(transactionId),
    retry: false,
  });
  if (transaction.isPending) return <Loading />;
  if (!transaction.data) return <Missing />;
  const item = transaction.data;
  return (
    <DetailShell locale={locale} title={content.transactionTitle}>
      {item.backend === "SIMULATOR" ? <Warning /> : null}
      <FactGrid
        facts={[
          [content.transactionId, item.transactionId],
          [content.backend, sourceName(item.backend, content)],
          [content.network, item.networkId],
          [content.blockHeight, item.blockHeight ?? "—"],
          [content.blockHash, item.blockHash ?? "—"],
          [content.proofId, item.proofId],
          [content.resourceId, item.resourceId],
          [content.versionId, item.versionId],
          [content.contentDigest, item.contentDigest],
          [content.submitted, formatDate(locale, item.submittedAt)],
          [content.confirmed, formatDate(locale, item.confirmedAt)],
        ]}
      />
      <div className="mt-8 flex flex-wrap gap-4">
        {item.blockHeight !== null ? (
          <Link
            className="text-sm font-semibold text-accent no-underline hover:underline"
            href={blockRoute(locale, item.backend, item.networkId, item.blockHeight)}
          >
            {content.viewBlock}
          </Link>
        ) : null}
        <Link
          className="text-sm font-semibold text-accent no-underline hover:underline"
          href={localizedRoute(locale, `/evidence/${item.proofId}`)}
        >
          {content.viewProof}
        </Link>
        <Link
          className="text-sm font-semibold text-accent no-underline hover:underline"
          href={localizedRoute(
            locale,
            `/verify?transactionId=${encodeURIComponent(item.transactionId)}&digest=${item.contentDigest}`,
          )}
        >
          {content.verifyTransaction}
        </Link>
      </div>
    </DetailShell>
  );
}

function DetailShell({
  locale,
  title,
  children,
}: {
  locale: string;
  title: unknown;
  children: React.ReactNode;
}) {
  const content = useIntlayer("ledger-page");
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        className="text-sm font-semibold text-accent no-underline hover:underline"
        href={localizedRoute(locale, "/ledger")}
      >
        {content.backToLedger}
      </Link>
      <p className="mt-10 mb-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 mb-8 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {String(title)}
      </h1>
      {children}
    </div>
  );
}

function FactGrid({ facts }: { facts: Array<[unknown, unknown]> }) {
  return (
    <dl className="divide-y divide-border rounded-md border border-border bg-surface">
      {facts.map(([label, value]) => (
        <div
          className="grid gap-2 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
          key={String(label)}
        >
          <dt className="text-sm text-ink-tertiary">{String(label)}</dt>
          <dd className="m-0 break-all font-mono text-sm leading-6">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Warning() {
  const content = useIntlayer("ledger-page");
  return (
    <p className="mb-6 rounded-sm border-l-2 border-warning bg-warning-soft px-4 py-3 text-sm leading-6">
      {content.simulatorWarning}
    </p>
  );
}

function Loading() {
  const content = useIntlayer("ledger-page");
  return <p className="py-24 text-center text-ink-secondary">{content.loading}</p>;
}

function Missing() {
  const content = useIntlayer("ledger-page");
  return (
    <p className="py-24 text-center text-danger" role="alert">
      {content.notFound}
    </p>
  );
}

function formatDate(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

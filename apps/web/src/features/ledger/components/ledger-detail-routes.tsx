"use client";

import { useSearchParams } from "next/navigation";

import { LedgerBlockDetail, LedgerTransactionDetail } from "./ledger-detail";

export function LedgerTransactionDetailRoute({ locale }: { locale: string }) {
  const transactionId = useSearchParams().get("transactionId") ?? "";

  return <LedgerTransactionDetail locale={locale} transactionId={transactionId} />;
}

export function LedgerBlockDetailRoute({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const backend = searchParams.get("backend") === "CHAINMAKER" ? "CHAINMAKER" : "SIMULATOR";
  const blockHeight = Number(searchParams.get("blockHeight") ?? 0);
  const networkId = searchParams.get("networkId") ?? "";

  return (
    <LedgerBlockDetail
      backend={backend}
      blockHeight={blockHeight}
      locale={locale}
      networkId={networkId}
    />
  );
}

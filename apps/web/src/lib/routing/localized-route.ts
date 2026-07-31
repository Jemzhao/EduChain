import type { Route } from "next";

export function localizedRoute(locale: string, suffix = ""): Route {
  return `/${locale}${suffix}` as Route;
}

function localizedQueryRoute(
  locale: string,
  pathname: string,
  values: Record<string, string | number>,
): Route {
  const search = new URLSearchParams(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  );
  return localizedRoute(locale, `${pathname}?${search.toString()}`);
}

export function resourceRoute(locale: string, resourceKey: string): Route {
  return localizedQueryRoute(locale, "/resources/view", { resourceKey });
}

export function resourceEditorRoute(locale: string, resourceId: string): Route {
  return localizedQueryRoute(locale, "/studio/resources/edit", { resourceId });
}

export function evidenceRoute(locale: string, proofId: string): Route {
  return localizedQueryRoute(locale, "/evidence/view", { proofId });
}

export function ledgerTransactionRoute(locale: string, transactionId: string): Route {
  return localizedQueryRoute(locale, "/ledger/transaction", { transactionId });
}

export function ledgerBlockRoute(
  locale: string,
  backend: string,
  networkId: string,
  blockHeight: number,
): Route {
  return localizedQueryRoute(locale, "/ledger/block", {
    backend,
    networkId,
    blockHeight,
  });
}

import { Locales } from "intlayer";
import { Suspense } from "react";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { LedgerTransactionDetailRoute } from "@/features/ledger/components/ledger-detail-routes";

type LedgerTransactionPageProps = { params: Promise<{ locale?: string }> };

export default async function LedgerTransactionPage({ params }: LedgerTransactionPageProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <Suspense>
            <LedgerTransactionDetailRoute locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

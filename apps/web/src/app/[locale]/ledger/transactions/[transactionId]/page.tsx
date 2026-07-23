import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { LedgerTransactionDetail } from "@/features/ledger/components/ledger-detail";

type LedgerTransactionPageProps = {
  params: Promise<{ locale?: string; transactionId: string }>;
};

const Page = async ({ params }: LedgerTransactionPageProps) => {
  const values = await params;
  const locale = values.locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={locale}>
      <SiteHeader locale={locale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <LedgerTransactionDetail
            locale={locale}
            transactionId={decodeURIComponent(String(values.transactionId))}
          />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
};

export default Page;

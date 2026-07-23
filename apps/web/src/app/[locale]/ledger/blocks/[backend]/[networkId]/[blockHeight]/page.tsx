import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { LedgerBlockDetail } from "@/features/ledger/components/ledger-detail";

type LedgerBlockPageProps = {
  params: Promise<{
    locale?: string;
    backend: string;
    networkId: string;
    blockHeight: string;
  }>;
};

const Page = async ({ params }: LedgerBlockPageProps) => {
  const values = await params;
  const locale = values.locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  const backend = values.backend === "CHAINMAKER" ? "CHAINMAKER" : "SIMULATOR";
  return (
    <IntlayerServerProvider locale={locale}>
      <SiteHeader locale={locale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <LedgerBlockDetail
            backend={backend}
            blockHeight={Number(values.blockHeight)}
            locale={locale}
            networkId={decodeURIComponent(String(values.networkId))}
          />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
};

export default Page;

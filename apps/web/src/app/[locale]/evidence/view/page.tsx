import { Locales } from "intlayer";
import { Suspense } from "react";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { EvidenceDetailRoute } from "@/features/evidence/components/evidence-detail-route";

type EvidencePageProps = { params: Promise<{ locale?: string }> };

export default async function EvidencePage({ params }: EvidencePageProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <Suspense>
            <EvidenceDetailRoute locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

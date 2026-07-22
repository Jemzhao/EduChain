import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { EvidenceDetail } from "@/features/evidence/components/evidence-detail";

type EvidencePageProps = { params: Promise<{ locale?: string; proofId: string }> };

export default async function EvidencePage({ params }: EvidencePageProps) {
  const { locale, proofId } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <EvidenceDetail locale={currentLocale} proofId={proofId} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

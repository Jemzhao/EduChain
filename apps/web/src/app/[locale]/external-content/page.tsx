import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { ExternalContentPage } from "@/features/external-content/components/external-content-page";

type ExternalContentRouteProps = { params: Promise<{ locale?: string }> };

export default async function ExternalContentRoute({ params }: ExternalContentRouteProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <ExternalContentPage />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

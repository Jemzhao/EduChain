import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { SupportPage } from "@/features/support/components/support-page";

type SupportRouteProps = { params: Promise<{ locale?: string }> };

export default async function SupportRoute({ params }: SupportRouteProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <SupportPage locale={currentLocale} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

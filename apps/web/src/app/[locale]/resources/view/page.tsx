import { Locales } from "intlayer";
import { Suspense } from "react";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { ResourceDetailRoute } from "@/features/resources/components/resource-detail-route";

type ResourcePageProps = { params: Promise<{ locale?: string }> };

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main id="page-content">
        <Container>
          <Suspense>
            <ResourceDetailRoute locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

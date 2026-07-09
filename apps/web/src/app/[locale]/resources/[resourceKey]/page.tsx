import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { ResourceDetail } from "@/features/resources/components/resource-detail";

type ResourcePageProps = { params: Promise<{ locale?: string; resourceKey: string }> };

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { locale, resourceKey } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main id="page-content">
        <Container>
          <ResourceDetail locale={currentLocale} resourceKey={resourceKey} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

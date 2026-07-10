import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { DiscoverPage } from "@/features/resources/components/discover-page";

type CategoryPageProps = { params: Promise<{ locale?: string; slug: string }> };

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main id="page-content">
        <Container>
          <Suspense>
            <DiscoverPage initialCategory={slug} locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

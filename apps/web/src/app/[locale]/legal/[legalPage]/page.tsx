import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import {
  InformationPage,
  type InformationPageKey,
} from "@/features/information/components/information-page";

const pages = new Set<InformationPageKey>(["terms", "privacy", "copyright", "disclaimer"]);
type Props = { params: Promise<{ locale?: string; legalPage: string }> };

export default async function Page({ params }: Props) {
  const { locale, legalPage } = await params;
  if (!pages.has(legalPage as InformationPageKey)) notFound();
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <InformationPage locale={currentLocale} page={legalPage as InformationPageKey} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

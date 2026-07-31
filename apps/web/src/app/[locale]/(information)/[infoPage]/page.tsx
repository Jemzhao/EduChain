import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import {
  InformationPage,
  type InformationPageKey,
} from "@/features/information/components/information-page";

const pageKeys = [
  "help",
  "guides",
  "developers",
  "changelog",
  "about",
  "contact",
  "cooperation",
] as const satisfies readonly InformationPageKey[];
const pages = new Set<InformationPageKey>(pageKeys);
type Props = { params: Promise<{ locale?: string; infoPage: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return pageKeys.map((infoPage) => ({ infoPage }));
}

export default async function Page({ params }: Props) {
  const { locale, infoPage } = await params;
  if (!pages.has(infoPage as InformationPageKey)) notFound();
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-16" id="page-content">
        <Container>
          <InformationPage locale={currentLocale} page={infoPage as InformationPageKey} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

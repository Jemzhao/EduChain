import { getIntlayer, getMultilingualUrls, Locales } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams, NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { SiteHeader } from "@/components/layout/site-header";
import { HomePage } from "@/features/home/home-page";

export const generateMetadata = async ({ params }: LocalPromiseParams): Promise<Metadata> => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  const metadata = getIntlayer("site-metadata", currentLocale);
  const multilingualUrls = getMultilingualUrls("/");
  const canonical = multilingualUrls[currentLocale as keyof typeof multilingualUrls];

  return {
    ...metadata,
    alternates: {
      canonical,
      languages: { ...multilingualUrls, "x-default": "/" },
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonical,
    },
  };
};

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <HomePage locale={currentLocale} />
    </IntlayerServerProvider>
  );
};

export default Page;

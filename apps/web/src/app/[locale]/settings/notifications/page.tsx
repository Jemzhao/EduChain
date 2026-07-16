import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-20" id="page-content">
        <Container>
          <NotificationPreferences locale={currentLocale} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
};

export default Page;

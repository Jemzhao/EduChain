import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider, useIntlayer } from "next-intlayer/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { VerificationCenter } from "@/features/evidence/components/verification-center";

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-20" id="page-content">
        <Container>
          <Suspense fallback={<VerificationFallback />}>
            <VerificationCenter locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
};

function VerificationFallback() {
  const content = useIntlayer("evidence");
  return (
    <p className="py-24 text-center text-ink-secondary" aria-live="polite">
      {content.loading}
    </p>
  );
}

export default Page;

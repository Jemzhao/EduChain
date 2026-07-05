import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider, useIntlayer } from "next-intlayer/server";
import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

function ResetPasswordPageContent({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  return (
    <>
      <SiteHeader locale={locale} />
      <AuthShell
        description={content.resetDescription}
        eyebrow={content.resetEyebrow}
        title={content.resetTitle}
      >
        <Suspense fallback={null}>
          <ResetPasswordForm locale={locale} />
        </Suspense>
      </AuthShell>
    </>
  );
}

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <ResetPasswordPageContent locale={currentLocale} />
    </IntlayerServerProvider>
  );
};

export default Page;

import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider, useIntlayer } from "next-intlayer/server";

import { SiteHeader } from "@/components/layout/site-header";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

function ForgotPasswordPageContent({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  return (
    <>
      <SiteHeader locale={locale} />
      <AuthShell
        description={content.resetRequestDescription}
        eyebrow={content.resetRequestEyebrow}
        title={content.resetRequestTitle}
      >
        <ForgotPasswordForm locale={locale} />
      </AuthShell>
    </>
  );
}

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <ForgotPasswordPageContent locale={currentLocale} />
    </IntlayerServerProvider>
  );
};

export default Page;

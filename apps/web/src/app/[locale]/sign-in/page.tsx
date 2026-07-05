import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider, useIntlayer } from "next-intlayer/server";

import { SiteHeader } from "@/components/layout/site-header";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

function SignInPageContent({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  return (
    <>
      <SiteHeader locale={locale} />
      <AuthShell
        description={content.signInDescription}
        eyebrow={content.signInEyebrow}
        title={content.signInTitle}
      >
        <SignInForm locale={locale} />
      </AuthShell>
    </>
  );
}

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SignInPageContent locale={currentLocale} />
    </IntlayerServerProvider>
  );
};

export default Page;

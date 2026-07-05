import { Locales } from "intlayer";
import type { NextPageIntlayer } from "next-intlayer";
import { IntlayerServerProvider, useIntlayer } from "next-intlayer/server";

import { SiteHeader } from "@/components/layout/site-header";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

function SignUpPageContent({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  return (
    <>
      <SiteHeader locale={locale} />
      <AuthShell
        description={content.signUpDescription}
        eyebrow={content.signUpEyebrow}
        title={content.signUpTitle}
      >
        <SignUpForm locale={locale} />
      </AuthShell>
    </>
  );
}

const Page: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SignUpPageContent locale={currentLocale} />
    </IntlayerServerProvider>
  );
};

export default Page;

import { getHTMLTextDir, Locales } from "intlayer";
import Script from "next/script";
import { IntlayerClientProvider, type NextLayoutIntlayer } from "next-intlayer";

import "@/styles/globals.css";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { ApiModeIndicator } from "@/features/system/components/api-mode-indicator";
import { themeInitializationScript } from "@/lib/theme/theme-preference";

export { generateStaticParams } from "next-intlayer";

export const dynamicParams = false;

const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <html
      data-scroll-behavior="smooth"
      data-theme="system"
      dir={getHTMLTextDir(currentLocale)}
      lang={currentLocale}
      suppressHydrationWarning
    >
      <head>
        <Script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
          id="theme-initialization"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <IntlayerClientProvider locale={currentLocale}>
          <AppProviders>
            {children}
            <SiteFooter />
            <ApiModeIndicator />
          </AppProviders>
        </IntlayerClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;

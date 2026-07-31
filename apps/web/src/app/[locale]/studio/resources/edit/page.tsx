import { Locales } from "intlayer";
import { Suspense } from "react";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { ResourceEditorRoute } from "@/features/studio/components/resource-editor-route";

type EditorPageProps = { params: Promise<{ locale?: string }> };

export default async function EditorPage({ params }: EditorPageProps) {
  const { locale } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;

  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-10 sm:py-14" id="page-content">
        <Container>
          <Suspense>
            <ResourceEditorRoute locale={currentLocale} />
          </Suspense>
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { ResourceEditor } from "@/features/studio/components/resource-editor";

type EditorPageProps = { params: Promise<{ locale?: string; resourceId: string }> };

export default async function EditorPage({ params }: EditorPageProps) {
  const { locale, resourceId } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-10 sm:py-14" id="page-content">
        <Container>
          <ResourceEditor locale={currentLocale} resourceId={resourceId} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

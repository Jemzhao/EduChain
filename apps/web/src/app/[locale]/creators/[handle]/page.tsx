import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicProfile } from "@/features/profile/components/public-profile";

type PublicProfilePageProps = { params: Promise<{ locale?: string; handle: string }> };

const creatorHandles = [
  "demo_creator",
  "maya_chen",
  "lin_zhiyuan",
  "zhou_yuan",
  "alex_wu",
  "sophia_li",
  "chen_mo",
  "tang_yi",
  "nora_xu",
  "he_jing",
  "sun_qi",
  "gao_ran",
] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return creatorHandles.map((handle) => ({ handle }));
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { locale, handle } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-12 sm:py-20" id="page-content">
        <Container>
          <PublicProfile handle={handle} locale={currentLocale} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

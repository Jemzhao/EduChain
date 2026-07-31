import { Locales } from "intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminWorkspace, type AdminSection } from "@/features/admin/components/admin-workspace";

const sectionKeys = [
  "overview",
  "users",
  "content",
  "taxonomy",
  "evidence",
  "support",
  "external-content",
  "statistics",
  "settings",
  "maintenance",
  "audit",
  "health",
] as const satisfies readonly AdminSection[];
const sections = new Set<AdminSection>(sectionKeys);

type AdminPageProps = { params: Promise<{ locale?: string; section?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { section: [] },
    ...sectionKeys
      .filter((section) => section !== "overview")
      .map((section) => ({ section: [section] })),
  ];
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale, section } = await params;
  const currentLocale = locale ?? Locales.CHINESE_SIMPLIFIED_CHINA;
  const currentSection = section?.[0] ?? "overview";
  if (section && (section.length !== 1 || !sections.has(currentSection as AdminSection)))
    notFound();
  return (
    <IntlayerServerProvider locale={currentLocale}>
      <SiteHeader locale={currentLocale} />
      <main className="py-10 sm:py-14" id="page-content">
        <Container size="wide">
          <AdminWorkspace locale={currentLocale} section={currentSection as AdminSection} />
        </Container>
      </main>
    </IntlayerServerProvider>
  );
}

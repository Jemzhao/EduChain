"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  FileWarning,
  FolderTree,
  Globe2,
  Headset,
  History,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { getAdminOverview } from "@/data-access/queries/admin";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";
import { ContentSection } from "./admin-sections/content-section";
import { EvidenceSection } from "./admin-sections/evidence-section";
import { ExternalContentSection } from "./admin-sections/external-content-section";
import { MaintenanceSection } from "./admin-sections/maintenance-section";
import {
  AuditSection,
  HealthSection,
  StatisticsSection,
} from "./admin-sections/operations-sections";
import { SettingsSection } from "./admin-sections/settings-section";
import { SupportSection } from "./admin-sections/support-section";
import { TaxonomySection } from "./admin-sections/taxonomy-section";
import { UsersSection } from "./admin-sections/users-section";
import { AccessState, Loading, LoadError, SectionHeader, statusText } from "./admin-ui";

export type AdminSection =
  | "overview"
  | "users"
  | "content"
  | "taxonomy"
  | "evidence"
  | "support"
  | "external-content"
  | "statistics"
  | "settings"
  | "maintenance"
  | "audit"
  | "health";

export function AdminWorkspace({ locale, section }: { locale: string; section: AdminSection }) {
  const content = useIntlayer("admin");
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const roles = currentUser.data?.roles ?? [];
  const permitted = roles.some((role) => role === "MODERATOR" || role === "ADMINISTRATOR");
  const administrator = roles.includes("ADMINISTRATOR");

  if (currentUser.isPending) return <Loading />;
  if (!currentUser.data) return <AccessState message={content.authenticationRequired} />;
  if (!permitted) return <AccessState message={content.accessDenied} />;

  return (
    <div className="grid gap-10 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <p className="m-0 text-xs font-semibold tracking-[0.1em] text-accent uppercase">
          {content.areaLabel}
        </p>
        <h1 className="mt-3 mb-0 text-xl font-semibold tracking-[-0.025em]">{content.title}</h1>
        <nav
          aria-label={String(content.title)}
          className="mt-6 flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible"
        >
          <AdminNavigation locale={locale} section={section} administrator={administrator} />
        </nav>
      </aside>
      <div className="min-w-0">
        {section === "overview" ? <Overview locale={locale} /> : null}
        {section === "users" ? <UsersSection currentUserId={currentUser.data.user.id} /> : null}
        {section === "content" ? <ContentSection /> : null}
        {section === "taxonomy" ? <TaxonomySection administrator={administrator} /> : null}
        {section === "evidence" ? <EvidenceSection administrator={administrator} /> : null}
        {section === "support" ? <SupportSection /> : null}
        {section === "external-content" ? (
          <ExternalContentSection administrator={administrator} />
        ) : null}
        {section === "statistics" ? <StatisticsSection /> : null}
        {section === "settings" ? <SettingsSection /> : null}
        {section === "maintenance" ? <MaintenanceSection /> : null}
        {section === "audit" ? <AuditSection /> : null}
        {section === "health" ? <HealthSection /> : null}
      </div>
    </div>
  );
}

function AdminNavigation({
  locale,
  section,
  administrator,
}: {
  locale: string;
  section: AdminSection;
  administrator: boolean;
}) {
  const content = useIntlayer("admin");
  const links: Array<{
    section: AdminSection;
    label: React.ReactNode;
    icon: typeof LayoutDashboard;
    administrator?: boolean;
  }> = [
    { section: "overview", label: content.overview, icon: LayoutDashboard },
    { section: "users", label: content.users, icon: Users, administrator: true },
    { section: "content", label: content.content, icon: FileWarning },
    { section: "taxonomy", label: content.taxonomy, icon: FolderTree },
    { section: "evidence", label: content.evidence, icon: ShieldCheck },
    { section: "support", label: content.support, icon: Headset },
    { section: "external-content", label: content.externalContent, icon: Globe2 },
    { section: "statistics", label: content.statistics, icon: BarChart3, administrator: true },
    { section: "settings", label: content.settings, icon: Settings, administrator: true },
    { section: "maintenance", label: content.maintenance, icon: Wrench, administrator: true },
    { section: "audit", label: content.audit, icon: History, administrator: true },
    { section: "health", label: content.health, icon: Activity, administrator: true },
  ];
  return links
    .filter((item) => !item.administrator || administrator)
    .map((item) => {
      const Icon = item.icon;
      const suffix = item.section === "overview" ? "/admin" : `/admin/${item.section}`;
      return (
        <Link
          aria-current={section === item.section ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-sm px-3 text-sm font-medium no-underline ${
            section === item.section
              ? "bg-accent-soft text-accent"
              : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
          }`}
          href={localizedRoute(locale, suffix)}
          key={item.section}
        >
          <Icon aria-hidden="true" className="size-4" />
          {item.label}
        </Link>
      );
    });
}

function Overview({ locale }: { locale: string }) {
  const content = useIntlayer("admin");
  const query = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    retry: false,
  });
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  const cards = [
    { label: content.openReports, value: query.data.openReports, section: "content" },
    { label: content.restrictedUsers, value: query.data.restrictedUsers, section: "users" },
    { label: content.withdrawnResources, value: query.data.withdrawnResources, section: "content" },
    { label: content.hiddenComments, value: query.data.hiddenComments, section: "content" },
    {
      label: content.retryableEvidence,
      value: query.data.retryableEvidenceJobs,
      section: "evidence",
    },
    {
      label: content.businessHealth,
      value: statusText(query.data.health, content),
      section: "health",
    },
  ];
  return (
    <div>
      <SectionHeader title={content.overview} description={content.description} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            className="group rounded-md border border-border bg-surface p-5 no-underline transition-colors hover:border-border-strong"
            href={localizedRoute(locale, `/admin/${card.section}`)}
            key={String(card.label)}
          >
            <p className="m-0 text-sm text-ink-secondary">{card.label}</p>
            <p className="mt-4 mb-0 text-3xl font-semibold tracking-[-0.04em]">{card.value}</p>
            <span className="mt-5 inline-flex text-xs font-semibold text-accent group-hover:underline">
              {content.viewQueue}
            </span>
          </Link>
        ))}
      </div>
      <section className="mt-8 rounded-md bg-surface-subtle p-6">
        <BookOpenCheck aria-hidden="true" className="size-6 text-accent" />
        <h2 className="mt-5 mb-0 text-lg font-semibold">{content.decisionPrincipleTitle}</h2>
        <p className="mt-3 mb-0 max-w-3xl text-sm leading-6 text-ink-secondary">
          {content.decisionPrincipleDescription}
        </p>
      </section>
    </div>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer, useLocale } from "next-intlayer";
import { exportAdminStatistics, resolveAdminOperationalAlert } from "@/data-access/mutations/admin";
import {
  getAdminAuditEvents,
  getAdminSystemHealth,
  getAdminOperationalAlerts,
  getAdminOperationalEvents,
  getAdminOperationalMetrics,
  getAdminStatistics,
} from "@/data-access/queries/admin";
import {
  DateValue,
  GovernanceAction,
  ItemList,
  Loading,
  LoadError,
  metricUnit,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

export function AuditSection() {
  const content = useIntlayer("admin");
  const query = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => getAdminAuditEvents(),
    retry: false,
  });
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  return (
    <div>
      <SectionHeader title={content.auditTitle} description={content.auditDescription} />
      <ResponsiveTable
        columns={[
          content.actionLabel,
          content.targetLabel,
          content.actionReasonLabel,
          content.requestLabel,
          content.createdLabel,
        ]}
      >
        {query.data.items.map((event) => (
          <tr className="border-t border-border align-top" key={event.id}>
            <td className="px-4 py-4">
              <p className="m-0 text-sm font-semibold">{event.action}</p>
              <StatusBadge>{event.result}</StatusBadge>
            </td>
            <td className="px-4 py-4 text-xs text-ink-secondary">
              {statusText(event.targetType, content)}
              <br />
              <span className="font-mono">{event.targetId}</span>
            </td>
            <td className="max-w-sm px-4 py-4 text-sm leading-6 text-ink-secondary">
              {event.reason ?? content.noValue}
            </td>
            <td className="px-4 py-4 font-mono text-xs text-ink-tertiary">{event.requestId}</td>
            <td className="px-4 py-4 text-xs text-ink-tertiary">
              <DateValue value={event.createdAt} />
            </td>
          </tr>
        ))}
      </ResponsiveTable>
    </div>
  );
}

export function HealthSection() {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const health = useQuery({
    queryKey: ["admin", "health"],
    queryFn: getAdminSystemHealth,
    retry: false,
    refetchInterval: 30_000,
  });
  const metrics = useQuery({
    queryKey: ["admin", "operational-metrics"],
    queryFn: getAdminOperationalMetrics,
    retry: false,
    refetchInterval: 30_000,
  });
  const alerts = useQuery({
    queryKey: ["admin", "operational-alerts"],
    queryFn: getAdminOperationalAlerts,
    retry: false,
  });
  const events = useQuery({
    queryKey: ["admin", "operational-events"],
    queryFn: () => getAdminOperationalEvents(20),
    retry: false,
  });
  if (health.isPending || metrics.isPending || alerts.isPending || events.isPending) {
    return <Loading />;
  }
  if (!health.data || !metrics.data || !alerts.data || !events.data) return <LoadError />;
  return (
    <div className="space-y-12">
      <SectionHeader title={content.healthTitle} description={content.healthDescription} />
      <section>
        <h2 className="m-0 text-xl font-semibold">{content.capabilityHealth}</h2>
        <div className="mt-5 space-y-3">
          {health.data.components.map((component) => (
            <section
              className="flex flex-wrap items-start justify-between gap-5 rounded-md border border-border bg-surface p-5"
              key={component.name}
            >
              <div>
                <h2 className="m-0 text-base font-semibold">
                  {statusText(component.name, content)}
                </h2>
                <p className="mt-2 mb-0 text-sm text-ink-secondary">
                  {statusText(component.summaryCode, content)}
                </p>
              </div>
              <StatusBadge>{statusText(component.status, content)}</StatusBadge>
            </section>
          ))}
        </div>
      </section>
      <section>
        <h2 className="m-0 text-xl font-semibold">{content.operationalMetrics}</h2>
        <p className="mt-2 mb-0 text-sm text-ink-secondary">
          {content.operationalMetricsDescription}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.data.items.map((metric) => (
            <article className="rounded-md border border-border bg-surface p-5" key={metric.name}>
              <div className="flex items-start justify-between gap-3">
                <p className="m-0 text-xs font-semibold text-ink-tertiary">
                  {statusText(metric.name, content)}
                </p>
                <StatusBadge>{statusText(metric.status, content)}</StatusBadge>
              </div>
              <p className="mt-4 mb-0 text-3xl font-semibold tracking-[-0.04em]">
                {new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
                  metric.value,
                )}
                <span className="ml-2 text-xs font-medium text-ink-tertiary">
                  {metricUnit(metric.unit, content)}
                </span>
              </p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="m-0 text-xl font-semibold">{content.operationalAlerts}</h2>
        <ItemList empty={alerts.data.items.length === 0}>
          {alerts.data.items.map((alert) => (
            <li className="flex flex-wrap items-start justify-between gap-5 p-5" key={alert.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge>{statusText(alert.severity, content)}</StatusBadge>
                  <StatusBadge>{statusText(alert.status, content)}</StatusBadge>
                </div>
                <p className="mt-3 mb-0 text-sm font-semibold">
                  {statusText(alert.component, content)}
                </p>
                <p className="mt-1 mb-0 font-mono text-xs text-ink-tertiary">
                  {alert.summaryCode} · {content.occurrences}: {alert.occurrenceCount}
                </p>
              </div>
              {alert.status === "OPEN" ? (
                <GovernanceAction
                  actionLabel={content.resolveAlert}
                  onConfirm={async (reason) => {
                    await resolveAdminOperationalAlert(alert.id, alert.version, reason);
                    await queryClient.invalidateQueries({ queryKey: ["admin"] });
                  }}
                  target={String(statusText(alert.component, content))}
                />
              ) : null}
            </li>
          ))}
        </ItemList>
      </section>
      <section>
        <h2 className="m-0 text-xl font-semibold">{content.operationalEvents}</h2>
        <p className="mt-2 mb-0 text-sm text-ink-secondary">
          {content.operationalEventsDescription}
        </p>
        <ResponsiveTable
          columns={[
            content.actionLabel,
            content.targetLabel,
            content.statusLabel,
            content.createdLabel,
          ]}
        >
          {events.data.items.map((event) => (
            <tr className="border-t border-border" key={event.id}>
              <td className="px-4 py-4 font-mono text-xs">{event.summaryCode}</td>
              <td className="px-4 py-4 text-sm text-ink-secondary">
                {statusText(event.targetType, content)}
              </td>
              <td className="px-4 py-4">
                <StatusBadge>{statusText(event.result, content)}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-xs text-ink-tertiary">
                <DateValue value={event.occurredAt} />
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </section>
    </div>
  );
}

export function StatisticsSection() {
  const content = useIntlayer("admin");
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: getAdminStatistics,
    retry: false,
  });
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  const totals = [
    [content.statisticsUsers, query.data.users],
    [content.statisticsResources, query.data.publishedResources],
    [content.statisticsComments, query.data.comments],
    [content.statisticsLikes, query.data.likes],
    [content.statisticsViews, query.data.views],
    [content.statisticsEvidence, query.data.evidenceRecords],
  ] as const;
  const distributions = [
    [content.statisticsCategories, query.data.categories],
    [content.statisticsTags, query.data.tags],
    [content.statisticsResourceTypes, query.data.resourceTypes],
    [content.statisticsEvidenceBackends, query.data.evidenceBackends],
  ] as const;
  return (
    <div>
      <SectionHeader title={content.statisticsTitle} description={content.statisticsDescription} />
      <div className="mt-6">
        <GovernanceAction
          actionLabel={content.statisticsExport}
          onConfirm={async (reason) => {
            const csv = await exportAdminStatistics(reason);
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=UTF-8" }));
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "educhain-statistics.csv";
            anchor.click();
            URL.revokeObjectURL(url);
          }}
          target={String(content.statisticsTitle)}
          variant="secondary"
        />
      </div>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {totals.map(([label, value]) => (
          <div className="rounded-md border border-border bg-surface p-5" key={String(label)}>
            <dt className="text-sm text-ink-secondary">{label}</dt>
            <dd className="mt-3 ml-0 text-3xl font-semibold tracking-[-0.04em]">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {distributions.map(([title, items]) => (
          <section className="rounded-md border border-border bg-surface p-5" key={String(title)}>
            <h2 className="m-0 text-lg font-semibold">{title}</h2>
            <ol className="mt-4 list-none divide-y divide-border p-0">
              {items.map((item) => (
                <li className="flex items-center justify-between gap-4 py-3" key={item.key}>
                  <span className="truncate text-sm text-ink-secondary">{item.key}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <section className="mt-8 rounded-md border border-border bg-surface p-5">
        <h2 className="m-0 text-lg font-semibold">{content.statisticsTrend}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead className="text-xs text-ink-tertiary">
              <tr>
                <th className="px-3 py-3 font-semibold">{content.statisticsPeriod}</th>
                <th className="px-3 py-3 text-right font-semibold">
                  {content.statisticsRegistrations}
                </th>
                <th className="px-3 py-3 text-right font-semibold">
                  {content.statisticsPublications}
                </th>
                <th className="px-3 py-3 text-right font-semibold">{content.statisticsViews}</th>
              </tr>
            </thead>
            <tbody>
              {query.data.trends.map((trend) => (
                <tr className="border-t border-border" key={trend.period}>
                  <td className="px-3 py-3">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(`${trend.period}T00:00:00Z`))}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{trend.registrations}</td>
                  <td className="px-3 py-3 text-right font-medium">{trend.publications}</td>
                  <td className="px-3 py-3 text-right font-medium">{trend.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

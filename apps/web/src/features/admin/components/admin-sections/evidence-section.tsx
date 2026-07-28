"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { retryAdminEvidenceJob, requestAdminEvidence } from "@/data-access/mutations/admin";
import { getAdminEvidenceJobs, getAdminEvidenceIntegrity } from "@/data-access/queries/admin";
import {
  GovernanceAction,
  Loading,
  LoadError,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

export function EvidenceSection({ administrator }: { administrator: boolean }) {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "evidence"],
    queryFn: () => getAdminEvidenceJobs(),
    retry: false,
  });
  const integrity = useQuery({
    queryKey: ["admin", "evidence-integrity"],
    queryFn: getAdminEvidenceIntegrity,
    enabled: administrator,
    retry: false,
  });
  if (query.isPending || (administrator && integrity.isPending)) return <Loading />;
  if (!query.data || (administrator && !integrity.data)) return <LoadError />;
  return (
    <div>
      <SectionHeader
        title={content.evidenceTitle}
        description={content.decisionPrincipleDescription}
      />
      {integrity.data ? (
        <section className="mt-6 rounded-md border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-lg font-semibold">{content.evidenceIntegrity}</h2>
              <p className="mt-2 mb-0 text-sm text-ink-secondary">
                {content.evidenceIntegrityDescription}
              </p>
            </div>
            <StatusBadge>{statusText(integrity.data.status, content)}</StatusBadge>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [content.totalJobs, integrity.data.totalJobs],
              [content.totalRecords, integrity.data.totalRecords],
              [content.orphanRecords, integrity.data.orphanRecords],
              [content.mismatchedRecords, integrity.data.mismatchedRecords],
            ].map(([label, value]) => (
              <div className="rounded-sm bg-surface-subtle p-3" key={String(label)}>
                <dt className="text-xs text-ink-tertiary">{label}</dt>
                <dd className="mt-1 ml-0 text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      <ResponsiveTable
        columns={[
          content.resourceLabel,
          content.backendLabel,
          content.statusLabel,
          content.attemptsLabel,
          content.errorCodeLabel,
          "",
        ]}
      >
        {query.data.items.map((job) => (
          <tr className="border-t border-border align-top" key={job.id}>
            <td className="px-4 py-4">
              <p className="m-0 font-mono text-xs">{job.resourceId}</p>
              <p className="mt-1 mb-0 font-mono text-[0.6875rem] text-ink-tertiary">{job.id}</p>
            </td>
            <td className="px-4 py-4 text-sm">{statusText(job.backend, content)}</td>
            <td className="px-4 py-4">
              <StatusBadge>{statusText(job.status, content)}</StatusBadge>
            </td>
            <td className="px-4 py-4 text-sm text-ink-secondary">{job.attemptCount}</td>
            <td className="px-4 py-4 text-xs text-ink-tertiary">
              {job.errorCode ?? content.noValue}
            </td>
            <td className="px-4 py-4 text-right">
              <div className="flex flex-wrap justify-end gap-2">
                {administrator ? (
                  <GovernanceAction
                    actionLabel={content.ensureEvidence}
                    onConfirm={async (reason) => {
                      await requestAdminEvidence(job.resourceId, reason);
                      await queryClient.invalidateQueries({ queryKey: ["admin"] });
                    }}
                    target={job.resourceId}
                    variant="secondary"
                  />
                ) : null}
                {administrator && job.retryable ? (
                  <GovernanceAction
                    actionLabel={content.retryEvidence}
                    onConfirm={async (reason) => {
                      await retryAdminEvidenceJob(job.id, reason);
                      await queryClient.invalidateQueries({ queryKey: ["admin"] });
                    }}
                    target={job.id}
                  />
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </ResponsiveTable>
    </div>
  );
}

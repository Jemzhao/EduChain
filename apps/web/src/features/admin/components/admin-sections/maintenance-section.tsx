"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useId, useState } from "react";
import { Button } from "@/components/primitives/button";
import { requestAdminMaintenanceJob } from "@/data-access/mutations/admin";
import { getAdminMaintenanceJobs } from "@/data-access/queries/admin";
import {
  DateValue,
  Loading,
  LoadError,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

export function MaintenanceSection() {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const typeId = useId();
  const reasonId = useId();
  const announcementTitleId = useId();
  const announcementBodyId = useId();
  const [type, setType] = useState<components["schemas"]["MaintenanceJobType"]>("SEARCH_REBUILD");
  const [reason, setReason] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const query = useQuery({
    queryKey: ["admin", "maintenance"],
    queryFn: getAdminMaintenanceJobs,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: () =>
      requestAdminMaintenanceJob({
        type,
        reason: reason.trim(),
        announcementTitle: type === "SYSTEM_ANNOUNCEMENT" ? announcementTitle.trim() : null,
        announcementBody: type === "SYSTEM_ANNOUNCEMENT" ? announcementBody.trim() : null,
      }),
    onSuccess: async () => {
      setReason("");
      setAnnouncementTitle("");
      setAnnouncementBody("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "maintenance"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });
  const isAnnouncement = type === "SYSTEM_ANNOUNCEMENT";
  const valid =
    reason.trim().length >= 10 &&
    (!isAnnouncement ||
      (announcementTitle.trim().length > 0 && announcementBody.trim().length >= 10));
  const typeLabels: Record<components["schemas"]["MaintenanceJobType"], React.ReactNode> = {
    SEARCH_REBUILD: content.maintenanceSearchRebuild,
    EXPIRED_DATA_CLEANUP: content.maintenanceExpiredCleanup,
    BACKUP_REQUEST: content.maintenanceBackupRequest,
    SYSTEM_ANNOUNCEMENT: content.maintenanceAnnouncement,
  };

  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  return (
    <div>
      <SectionHeader
        title={content.maintenanceTitle}
        description={content.maintenanceDescription}
      />
      <section className="mt-8 rounded-md border border-border bg-surface p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="text-xs font-semibold" htmlFor={typeId}>
            {content.maintenanceType}
            <select
              className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
              id={typeId}
              onChange={(event) =>
                setType(event.target.value as components["schemas"]["MaintenanceJobType"])
              }
              value={type}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold" htmlFor={reasonId}>
            {content.actionReasonLabel}
            <input
              className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
              id={reasonId}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder={String(content.actionReasonHint)}
              value={reason}
            />
          </label>
        </div>
        {isAnnouncement ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <label className="text-xs font-semibold" htmlFor={announcementTitleId}>
              {content.maintenanceAnnouncementTitle}
              <input
                className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
                id={announcementTitleId}
                maxLength={120}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                value={announcementTitle}
              />
            </label>
            <label className="text-xs font-semibold" htmlFor={announcementBodyId}>
              {content.maintenanceAnnouncementBody}
              <textarea
                className="mt-2 block min-h-24 w-full resize-y rounded-sm border border-border bg-canvas p-3 text-sm"
                id={announcementBodyId}
                maxLength={1000}
                onChange={(event) => setAnnouncementBody(event.target.value)}
                value={announcementBody}
              />
            </label>
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="m-0 text-xs text-ink-tertiary">{content.actionImpact}</p>
          <Button
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? content.working : content.maintenanceSubmit}
          </Button>
        </div>
        {mutation.isError ? (
          <p className="mt-3 mb-0 text-xs text-danger" role="alert">
            {content.actionFailed}
          </p>
        ) : null}
      </section>

      <h3 className="mt-10 mb-0 text-xl font-semibold">{content.maintenanceHistory}</h3>
      <ResponsiveTable
        columns={[
          content.maintenanceType,
          content.maintenancePayload,
          content.statusLabel,
          content.maintenanceResult,
          content.createdLabel,
        ]}
      >
        {query.data.items.map((job) => (
          <tr className="border-t border-border align-top" key={job.id}>
            <td className="min-w-44 px-4 py-4 text-sm font-semibold">{typeLabels[job.type]}</td>
            <td className="min-w-56 max-w-xs px-4 py-4 text-sm text-ink-secondary">
              {job.type === "SYSTEM_ANNOUNCEMENT" ? job.payloadSummary : typeLabels[job.type]}
            </td>
            <td className="px-4 py-4">
              <StatusBadge>{statusText(job.status, content)}</StatusBadge>
            </td>
            <td className="px-4 py-4 text-sm text-ink-secondary">
              {maintenanceResultText(job.resultSummary, content)}
            </td>
            <td className="px-4 py-4 text-xs text-ink-tertiary">
              <DateValue value={job.createdAt} />
            </td>
          </tr>
        ))}
      </ResponsiveTable>
    </div>
  );
}

function maintenanceResultText(
  result: string | null,
  content: ReturnType<typeof useIntlayer<"admin">>,
) {
  if (!result) return content.noValue;
  const [code, count] = result.split(":", 2);
  const labels: Record<string, React.ReactNode> = {
    OPERATOR_ACTION_REQUIRED: content.maintenanceOperatorRequired,
    DOCUMENTS_REBUILT: content.maintenanceDocumentsRebuilt,
    RECORDS_CLEANED: content.maintenanceRecordsCleaned,
    RECIPIENTS_NOTIFIED: content.maintenanceRecipientsNotified,
    OPERATION_FAILED: content.failed,
  };
  const label = labels[code] ?? code;
  return count === undefined ? (
    label
  ) : (
    <>
      {label} · {count}
    </>
  );
}

"use client";

import type { components } from "@educhain/api-contract";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import {
  exportAdminResources,
  resolveAdminReport,
  reviewAdminResources,
  setAdminCommentHidden,
  setAdminResourceWithdrawn,
} from "@/data-access/mutations/admin";
import { getAdminComments, getAdminReports, getAdminResources } from "@/data-access/queries/admin";
import {
  DateValue,
  downloadCsv,
  GovernanceAction,
  ItemList,
  Loading,
  LoadError,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

export function ContentSection() {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [resourceStatus, setResourceStatus] = useState<
    components["schemas"]["ResourceStatus"] | ""
  >("");
  const resources = useQuery({
    queryKey: ["admin", "resources", resourceStatus],
    queryFn: () => getAdminResources(resourceStatus || undefined),
    retry: false,
  });
  const reports = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => getAdminReports(),
    retry: false,
  });
  const comments = useQuery({
    queryKey: ["admin", "comments"],
    queryFn: () => getAdminComments(),
    retry: false,
  });
  const refresh = () => {
    setSelectedResources([]);
    return queryClient.invalidateQueries({ queryKey: ["admin"] });
  };
  if (resources.isPending || reports.isPending || comments.isPending) return <Loading />;
  if (!resources.data || !reports.data || !comments.data) return <LoadError />;
  return (
    <div className="space-y-12">
      <section>
        <SectionHeader
          title={content.reportQueueTitle}
          description={content.decisionPrincipleDescription}
        />
        <ItemList empty={reports.data.items.length === 0}>
          {reports.data.items.map((report) => (
            <li className="p-5" key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{statusText(report.status, content)}</StatusBadge>
                    <span className="text-xs font-medium text-ink-tertiary">
                      {statusText(report.reason, content)}
                    </span>
                  </div>
                  <p className="mt-3 mb-0 text-sm font-semibold">
                    {statusText(report.targetType, content)} · {report.targetId}
                  </p>
                  <p className="mt-2 mb-0 max-w-3xl text-sm leading-6 text-ink-secondary">
                    {report.details}
                  </p>
                </div>
                {report.status === "OPEN" ? (
                  <div className="flex flex-wrap gap-2">
                    <GovernanceAction
                      actionLabel={content.resolveReport}
                      onConfirm={async (reason) => {
                        await resolveAdminReport(report.id, "RESOLVED", reason);
                        await refresh();
                      }}
                      target={`${String(statusText(report.targetType, content))} · ${report.targetId}`}
                    />
                    <GovernanceAction
                      actionLabel={content.dismissReport}
                      onConfirm={async (reason) => {
                        await resolveAdminReport(report.id, "DISMISSED", reason);
                        await refresh();
                      }}
                      target={`${String(statusText(report.targetType, content))} · ${report.targetId}`}
                      variant="secondary"
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ItemList>
      </section>

      <section>
        <SectionHeader
          title={content.resourceQueueTitle}
          description={content.decisionPrincipleDescription}
          compact
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <label className="text-xs font-semibold text-ink-tertiary">
            {content.contentView}
            <select
              className="ml-2 min-h-10 rounded-sm border border-border bg-surface px-3 text-sm text-ink"
              onChange={(event) =>
                setResourceStatus(
                  event.target.value as components["schemas"]["ResourceStatus"] | "",
                )
              }
              value={resourceStatus}
            >
              <option value="">{content.allResources}</option>
              <option value="PUBLISHED">{content.publishedResources}</option>
              <option value="WITHDRAWN">{content.withdrawnTrash}</option>
            </select>
          </label>
          <GovernanceAction
            actionLabel={content.exportResources}
            onConfirm={async (reason) =>
              downloadCsv(await exportAdminResources(reason), "educhain-resources.csv")
            }
            target={String(content.resourceQueueTitle)}
            variant="secondary"
          />
          {selectedResources.length ? (
            <>
              <GovernanceAction
                actionLabel={`${String(content.approveSelected)} (${selectedResources.length})`}
                onConfirm={async (reason) => {
                  await reviewAdminResources(selectedResources, "APPROVE", reason);
                  await refresh();
                }}
                target={`${selectedResources.length} ${String(content.resourceLabel)}`}
              />
              <GovernanceAction
                actionLabel={`${String(content.rejectSelected)} (${selectedResources.length})`}
                onConfirm={async (reason) => {
                  await reviewAdminResources(selectedResources, "REJECT", reason);
                  await refresh();
                }}
                target={`${selectedResources.length} ${String(content.resourceLabel)}`}
                variant="danger"
              />
            </>
          ) : null}
        </div>
        <ResponsiveTable
          columns={[
            "",
            content.resourceLabel,
            content.authorLabel,
            content.statusLabel,
            content.evidenceLabel,
            "",
          ]}
        >
          {resources.data.items.map((resource) => (
            <tr className="border-t border-border align-top" key={resource.id}>
              <td className="w-12 px-4 py-4">
                <input
                  aria-label={`${String(content.selectResource)} ${resource.title}`}
                  checked={selectedResources.includes(resource.id)}
                  onChange={(event) =>
                    setSelectedResources((current) =>
                      event.target.checked
                        ? [...current, resource.id]
                        : current.filter((id) => id !== resource.id),
                    )
                  }
                  type="checkbox"
                />
              </td>
              <td className="min-w-64 px-4 py-4">
                <p className="m-0 max-w-md font-semibold">{resource.title}</p>
                <p className="mt-1 mb-0 text-xs text-ink-tertiary">{resource.slug}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm text-ink-secondary">
                {resource.author.displayName}
              </td>
              <td className="px-4 py-4">
                <StatusBadge>{statusText(resource.status, content)}</StatusBadge>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-ink-tertiary">
                {statusText(resource.evidenceStatus, content)}
              </td>
              <td className="px-4 py-4 text-right">
                <GovernanceAction
                  actionLabel={
                    resource.status === "WITHDRAWN"
                      ? content.restoreResource
                      : content.withdrawResource
                  }
                  onConfirm={async (reason) => {
                    await setAdminResourceWithdrawn(
                      resource.id,
                      resource.status !== "WITHDRAWN",
                      reason,
                    );
                    await refresh();
                  }}
                  target={resource.title}
                  variant={resource.status === "WITHDRAWN" ? "secondary" : "danger"}
                />
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </section>

      <section>
        <SectionHeader
          title={content.commentQueueTitle}
          description={content.decisionPrincipleDescription}
          compact
        />
        <ItemList empty={comments.data.items.length === 0}>
          {comments.data.items.map((comment) => (
            <li className="p-5" key={comment.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{statusText(comment.status, content)}</StatusBadge>
                    <span className="text-xs text-ink-tertiary">{comment.resourceTitle}</span>
                  </div>
                  <p className="mt-3 mb-0 text-sm leading-6 text-ink-secondary">
                    {comment.body ?? content.noValue}
                  </p>
                  <p className="mt-2 mb-0 text-xs text-ink-tertiary">
                    {comment.author.displayName} · <DateValue value={comment.createdAt} />
                  </p>
                </div>
                {comment.status !== "DELETED" ? (
                  <GovernanceAction
                    actionLabel={
                      comment.status === "HIDDEN" ? content.restoreComment : content.hideComment
                    }
                    onConfirm={async (reason) => {
                      await setAdminCommentHidden(comment.id, comment.status !== "HIDDEN", reason);
                      await refresh();
                    }}
                    target={comment.resourceTitle}
                    variant={comment.status === "HIDDEN" ? "secondary" : "danger"}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ItemList>
      </section>
    </div>
  );
}

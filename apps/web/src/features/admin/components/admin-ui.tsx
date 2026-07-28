"use client";

import { CircleUserRound } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import { ConfirmationReasonAction } from "@/components/patterns/confirmation-reason-action";

export function EditorField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: React.ReactNode;
  onChange: (value: string) => void;
  type?: "email" | "text";
  value: string;
}) {
  return (
    <label className="text-xs font-semibold text-ink-tertiary">
      {label}
      <input
        className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm text-ink"
        minLength={2}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

export function GovernanceAction({
  actionLabel,
  target,
  onConfirm,
  variant = "danger",
}: {
  actionLabel: React.ReactNode;
  target: React.ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  variant?: "danger" | "secondary";
}) {
  const content = useIntlayer("admin");
  return (
    <ConfirmationReasonAction
      actionLabel={actionLabel}
      cancelLabel={content.cancel}
      confirmLabel={content.confirm}
      failedLabel={content.actionFailed}
      impact={content.actionImpact}
      onConfirm={onConfirm}
      reasonHint={content.actionReasonHint}
      reasonLabel={content.actionReasonLabel}
      target={target}
      variant={variant}
      workingLabel={content.working}
    />
  );
}

export function SectionHeader({
  title,
  description,
  compact = false,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={compact ? "pb-5" : "border-b border-border pb-8"}>
      <h2
        className={`m-0 font-semibold tracking-[-0.04em] ${compact ? "text-2xl" : "text-4xl sm:text-5xl"}`}
      >
        {title}
      </h2>
      <p className="mt-4 mb-0 max-w-3xl text-base leading-7 text-ink-secondary">{description}</p>
    </header>
  );
}

export function ResponsiveTable({
  columns,
  children,
}: {
  columns: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead className="bg-surface-subtle">
          <tr>
            {columns.map((column, index) => (
              <th className="px-4 py-3 text-xs font-semibold text-ink-tertiary" key={index}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ItemList({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  const content = useIntlayer("admin");
  return empty ? (
    <p className="mt-6 rounded-md border border-dashed border-border py-14 text-center text-sm text-ink-tertiary">
      {content.empty}
    </p>
  ) : (
    <ul className="mt-6 list-none divide-y divide-border rounded-md border border-border bg-surface p-0">
      {children}
    </ul>
  );
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-[var(--ed-radius-pill)] bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-secondary">
      {children}
    </span>
  );
}

export function DateValue({ value }: { value: string }) {
  const { locale } = useLocale();
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )}
    </time>
  );
}

export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=UTF-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function metricUnit(unit: string, content: ReturnType<typeof useIntlayer<"admin">>) {
  const units: Record<string, React.ReactNode> = {
    percent: content.unitPercent,
    ratio: content.unitRatio,
    count: content.unitCount,
  };
  return units[unit] ?? unit;
}

export function statusText(status: string, content: ReturnType<typeof useIntlayer<"admin">>) {
  const values: Record<string, React.ReactNode> = {
    ACTIVE: content.active,
    RESTRICTED: content.restricted,
    DISABLED: content.disabled,
    PUBLISHED: content.published,
    WITHDRAWN: content.withdrawn,
    VISIBLE: content.visible,
    HIDDEN: content.hidden,
    DELETED: content.deleted,
    OPEN: content.open,
    NEVER_SYNCED: content.externalNeverSynced,
    RUNNING: content.externalRunning,
    APPROVED: content.externalApproved,
    REJECTED: content.externalRejected,
    IN_PROGRESS: content.inProgress,
    WAITING_FOR_USER: content.waitingForUser,
    RESOLVED: content.resolved,
    CLOSED: content.closed,
    DISMISSED: content.dismissed,
    HEALTHY: content.healthy,
    DEGRADED: content.degraded,
    UNAVAILABLE: content.unavailable,
    PENDING: content.pending,
    PROCESSING: content.processing,
    SUBMITTING: content.processing,
    CONFIRMING: content.processing,
    CONFIRMED: content.confirmed,
    TERMINATED: content.terminated,
    RETRY_WAIT: content.retryWait,
    ACCEPTED: content.accepted,
    UNKNOWN: content.unknown,
    CERTIFICATE_PENDING: content.certificatePending,
    CERTIFICATE_FAILED: content.certificateFailed,
    COMPLETED: content.completed,
    CONSISTENT: content.consistent,
    ATTENTION_REQUIRED: content.attentionRequired,
    WARNING: content.warning,
    CRITICAL: content.critical,
    INFO: content.info,
    SIMULATOR: content.simulator,
    CHAINMAKER: content.chainmaker,
    CATEGORY: content.categoryKind,
    TAG: content.tagKind,
    RESOURCE: content.resourceTarget,
    COMMENT: content.commentTarget,
    REPORT: content.reportTarget,
    EVIDENCE_JOB: content.evidenceJobTarget,
    USER: content.userTarget,
    "java-server": content.javaServer,
    database: content.database,
    "evidence-gateway": content.evidenceGateway,
    "jvm.heap.used": content.metricJvmHeap,
    "storage.used": content.metricStorage,
    "system.load.per_processor": content.metricSystemLoad,
    "evidence.retryable_jobs": content.metricEvidenceRetry,
    DATABASE_AVAILABLE: content.healthDatabaseAvailable,
    DATABASE_UNAVAILABLE: content.healthDatabaseUnavailable,
    EVIDENCE_AVAILABLE: content.healthEvidenceAvailable,
    EVIDENCE_DELAYED: content.healthEvidenceDelayed,
    SERVER_AVAILABLE: content.healthServerAvailable,
    MODERATOR: content.roleModerator,
    ADMINISTRATOR: content.roleAdministrator,
    SPAM: content.reasonSpam,
    HARASSMENT: content.reasonHarassment,
    COPYRIGHT: content.reasonCopyright,
    MISINFORMATION: content.reasonMisinformation,
    UNSAFE_CONTENT: content.reasonUnsafeContent,
    OTHER: content.reasonOther,
    SUCCEEDED: content.succeeded,
    FAILED: content.failed,
    USER_STATUS_CHANGED: content.actionUserStatusChanged,
    RESOURCE_WITHDRAWN: content.actionResourceWithdrawn,
    RESOURCE_RESTORED: content.actionResourceRestored,
    COMMENT_HIDDEN: content.actionCommentHidden,
    COMMENT_RESTORED: content.actionCommentRestored,
    REPORT_RESOLVED: content.actionReportResolved,
    REPORT_DISMISSED: content.actionReportDismissed,
    CATEGORY_STATUS_CHANGED: content.actionCategoryStatusChanged,
    TAG_STATUS_CHANGED: content.actionTagStatusChanged,
    EVIDENCE_RETRY_SCHEDULED: content.actionEvidenceRetryScheduled,
  };
  return values[status] ?? status;
}

export function Loading() {
  const content = useIntlayer("admin");
  return (
    <p className="py-24 text-center text-ink-secondary" aria-live="polite">
      {content.loading}
    </p>
  );
}

export function LoadError() {
  const content = useIntlayer("admin");
  return (
    <p className="rounded-md bg-danger-soft py-20 text-center text-danger" role="alert">
      {content.loadError}
    </p>
  );
}

export function AccessState({ message }: { message: React.ReactNode }) {
  return (
    <div className="py-24 text-center">
      <CircleUserRound aria-hidden="true" className="mx-auto size-8 text-ink-tertiary" />
      <p className="mt-5 mb-0 text-ink-secondary">{message}</p>
    </div>
  );
}

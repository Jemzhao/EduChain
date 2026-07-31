"use client";

import { useId, useState } from "react";

import { Button } from "@/components/primitives/button";

type ConfirmationReasonActionProps = {
  actionLabel: React.ReactNode;
  target: React.ReactNode;
  impact: React.ReactNode;
  reasonLabel: React.ReactNode;
  reasonHint: React.ReactNode;
  cancelLabel: React.ReactNode;
  confirmLabel: React.ReactNode;
  workingLabel: React.ReactNode;
  failedLabel: React.ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  variant?: "danger" | "secondary";
};

export function ConfirmationReasonAction({
  actionLabel,
  target,
  impact,
  reasonLabel,
  reasonHint,
  cancelLabel,
  confirmLabel,
  workingLabel,
  failedLabel,
  onConfirm,
  variant = "danger",
}: ConfirmationReasonActionProps) {
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} type="button" variant={variant}>
        {actionLabel}
      </Button>
    );
  }
  return (
    <div className="w-full min-w-0 rounded-md border border-border-strong bg-canvas p-4 text-left shadow-sm sm:max-w-sm sm:min-w-64">
      <p className="m-0 text-sm font-semibold">{actionLabel}</p>
      <p className="mt-2 mb-0 break-words text-xs leading-5 text-ink-secondary">{target}</p>
      <p className="mt-3 mb-0 text-xs leading-5 text-ink-tertiary">{impact}</p>
      <label className="mt-4 block text-xs font-semibold" htmlFor={reasonId}>
        {reasonLabel}
      </label>
      <textarea
        className="mt-2 min-h-24 w-full resize-y rounded-sm border border-border bg-surface p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
        id={reasonId}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <p className="mt-2 mb-0 text-[0.6875rem] leading-4 text-ink-tertiary">{reasonHint}</p>
      {failed ? (
        <p className="mt-3 mb-0 text-xs text-danger" role="alert">
          {failedLabel}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button disabled={busy} onClick={() => setOpen(false)} type="button" variant="quiet">
          {cancelLabel}
        </Button>
        <Button
          disabled={busy || reason.trim().length < 10}
          onClick={async () => {
            setBusy(true);
            setFailed(false);
            try {
              await onConfirm(reason.trim());
              setOpen(false);
              setReason("");
            } catch {
              setFailed(true);
            } finally {
              setBusy(false);
            }
          }}
          type="button"
          variant={variant}
        >
          {busy ? workingLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleDashed, TriangleAlert } from "lucide-react";
import { useIntlayer } from "next-intlayer";

import { getServiceHealth } from "@/data-access/queries/system";
import { publicEnvironment } from "@/lib/env/public";

export function ServiceStatusCard() {
  const content = useIntlayer("system-status");
  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: getServiceHealth,
  });

  const mode = publicEnvironment.apiMode === "mock" ? content.mockMode : content.remoteMode;

  let icon = (
    <CircleDashed aria-hidden="true" className="size-4 animate-pulse motion-reduce:animate-none" />
  );
  let status = content.checking;
  let statusClass = "bg-surface-subtle text-ink-secondary";

  if (health.isSuccess) {
    icon = <CircleCheck aria-hidden="true" className="size-4" />;
    status = content.available;
    statusClass = "bg-success-soft text-success";
  } else if (health.isError) {
    icon = <TriangleAlert aria-hidden="true" className="size-4" />;
    status = content.unavailable;
    statusClass = "bg-warning-soft text-warning";
  }

  return (
    <aside className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4 shadow-[0_1px_2px_oklch(0.2_0.01_250/0.04)]">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
          {content.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{status}</span>
        </div>
      </div>
      <span
        className={`rounded-[var(--ed-radius-pill)] px-3 py-1 text-xs font-semibold ${statusClass}`}
      >
        {mode}
      </span>
    </aside>
  );
}

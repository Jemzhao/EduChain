"use client";

import { useIntlayer } from "next-intlayer";

import { publicEnvironment } from "@/lib/env/public";

export function ApiModeIndicator() {
  const content = useIntlayer("api-mode-indicator");
  const mode = publicEnvironment.apiMode === "mock" ? content.mock : content.remote;

  return (
    <div
      aria-label={`${String(content.label)}: ${String(mode)}`}
      className="fixed right-3 bottom-3 z-50 rounded-[var(--ed-radius-pill)] border border-border bg-surface/95 px-3 py-1.5 text-[0.6875rem] font-semibold text-ink-tertiary shadow-sm backdrop-blur-sm print:hidden"
      title={String(content.label)}
    >
      {mode}
    </div>
  );
}

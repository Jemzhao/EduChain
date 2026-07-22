"use client";

import type { components } from "@educhain/api-contract";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { getResourceEvidence } from "@/data-access/queries/evidence";
import { localizedRoute } from "@/lib/routing/localized-route";

type JobStatus = components["schemas"]["EvidenceJobStatus"];

const processingStatuses: JobStatus[] = [
  "PENDING",
  "SUBMITTING",
  "ACCEPTED",
  "UNKNOWN",
  "CONFIRMING",
];

export function EvidenceCard({
  locale,
  resourceId,
  versionNumber,
  contentDigest,
}: {
  locale: string;
  resourceId: string;
  versionNumber: number;
  contentDigest: string;
}) {
  const content = useIntlayer("evidence");
  const query = useQuery({
    queryKey: ["resource-evidence", resourceId],
    queryFn: () => getResourceEvidence(resourceId),
    retry: false,
    refetchInterval: (current) =>
      current.state.data && processingStatuses.includes(current.state.data.status) ? 5_000 : false,
  });
  const evidence = query.data;
  const proof = evidence?.proof;
  const source =
    evidence?.backend === "CHAINMAKER" ? content.sourceChainMaker : content.sourceSimulator;
  const status = evidence ? statusLabel(evidence.status, content) : content.statusProcessing;

  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <span className="flex size-9 items-center justify-center rounded-sm bg-accent-soft text-accent">
        <ShieldCheck aria-hidden="true" className="size-4" />
      </span>
      <h2 className="mt-5 mb-0 text-base font-semibold">{content.cardTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">{content.cardDescription}</p>
      <dl className="mt-5 space-y-4 border-t border-border pt-5 text-sm">
        <EvidenceFact label={content.versionLabel} value={`v${versionNumber}`} />
        <EvidenceFact
          label={content.statusLabel}
          value={query.isError ? content.requestError : status}
          accent
        />
        {evidence ? <EvidenceFact label={content.sourceLabel} value={source} /> : null}
        <EvidenceFact label={content.contentDigestLabel} value={contentDigest} mono />
      </dl>
      {proof ? (
        <>
          <p
            className={`mt-5 rounded-sm p-3 text-xs leading-5 ${
              proof.backend === "SIMULATOR"
                ? "bg-warning-soft text-warning"
                : "bg-success-soft text-success"
            }`}
          >
            {proof.backend === "SIMULATOR" ? content.simulatorNotice : content.chainMakerNotice}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent no-underline hover:underline"
            href={localizedRoute(locale, `/evidence/${proof.proofId}`)}
          >
            {content.viewProof}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      ) : null}
    </section>
  );
}

function EvidenceFact({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-tertiary">{label}</dt>
      <dd
        className={`mt-1 mb-0 break-all ${mono ? "font-mono text-[0.6875rem] leading-5" : "font-medium"} ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function statusLabel(status: JobStatus, content: ReturnType<typeof useIntlayer<"evidence">>) {
  if (status === "COMPLETED") return content.statusCompleted;
  if (status === "CONFIRMED") return content.statusConfirmed;
  if (status === "RETRY_WAIT") return content.statusRetrying;
  if (status === "CERTIFICATE_PENDING" || status === "CERTIFICATE_FAILED") {
    return content.statusCertificate;
  }
  if (status === "TERMINATED") return content.statusFailed;
  return content.statusProcessing;
}

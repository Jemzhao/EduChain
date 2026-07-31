"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { getPublicEvidence } from "@/data-access/queries/evidence";
import { publicEnvironment } from "@/lib/env/public";
import { localizedRoute, resourceRoute } from "@/lib/routing/localized-route";

export function EvidenceDetail({ locale, proofId }: { locale: string; proofId: string }) {
  const content = useIntlayer("evidence");
  const query = useQuery({
    queryKey: ["public-evidence", proofId],
    queryFn: () => getPublicEvidence(proofId),
    retry: false,
  });

  if (query.isPending) {
    return (
      <p className="py-24 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }
  if (!query.data) {
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {content.notFound}
      </p>
    );
  }

  const proof = query.data;
  const certificateUrl = `${publicEnvironment.apiBaseUrl}/evidence/${proof.proofId}/certificate`;
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );

  return (
    <article className="mx-auto max-w-5xl">
      <header className="border-b border-border pb-10">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary no-underline hover:text-accent"
          href={resourceRoute(locale, proof.resourceSlug)}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {content.backToResource}
        </Link>
        <p className="mt-8 mb-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.detailEyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
          {content.detailTitle}
        </h1>
        <p className="mt-5 mb-0 max-w-3xl text-lg leading-8 text-ink-secondary">
          {content.detailDescription}
        </p>
      </header>

      <section
        className={`mt-8 rounded-md border p-5 ${
          proof.backend === "SIMULATOR"
            ? "border-warning/30 bg-warning-soft"
            : "border-success/30 bg-success-soft"
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className={`mt-0.5 size-5 shrink-0 ${
              proof.backend === "SIMULATOR" ? "text-warning" : "text-success"
            }`}
          />
          <div>
            <h2 className="m-0 text-base font-semibold">
              {proof.backend === "SIMULATOR" ? content.sourceSimulator : content.sourceChainMaker}
            </h2>
            <p className="mt-2 mb-0 text-sm leading-6 text-ink-secondary">
              {proof.backend === "SIMULATOR" ? content.simulatorNotice : content.chainMakerNotice}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <dl className="grid gap-x-8 gap-y-6 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2 sm:p-8">
          <Fact label={content.resourceLabel} value={proof.resourceTitle} />
          <Fact label={content.authorLabel} value={proof.author.displayName} />
          <Fact label={content.versionLabel} value={`v${proof.versionNumber}`} />
          <Fact
            label={content.sourceLabel}
            value={
              proof.backend === "SIMULATOR" ? content.sourceSimulator : content.sourceChainMaker
            }
          />
          <Fact label={content.proofIdFact} value={proof.proofId} mono wide />
          <Fact label={content.networkLabel} value={proof.networkId} mono />
          <Fact
            label={content.transactionLabel}
            value={proof.transactionId ?? content.notApplicable}
            mono
            wide
          />
          <Fact
            label={content.blockHeightLabel}
            value={proof.blockHeight ?? content.notApplicable}
          />
          <Fact
            label={content.blockHashLabel}
            value={proof.blockHash ?? content.notApplicable}
            mono
            wide
          />
          <Fact label={content.contentDigestLabel} value={proof.contentDigest} mono wide />
          <Fact
            label={content.merkleRootLabel}
            value={proof.attachmentMerkleRoot ?? content.notApplicable}
            mono
            wide
          />
          <Fact label={content.canonicalizationLabel} value={proof.canonicalizationVersion} mono />
          <Fact label={content.submittedLabel} value={formatDate(proof.submittedAt)} />
          <Fact label={content.confirmedLabel} value={formatDate(proof.confirmedAt)} />
        </dl>

        <aside className="space-y-3 rounded-md bg-surface-subtle p-5">
          <FileCheck2 aria-hidden="true" className="size-6 text-accent" />
          <h2 className="pt-2 text-base font-semibold">{content.cardTitle}</h2>
          {proof.certificateStatus === "AVAILABLE" ? (
            <a
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold no-underline hover:bg-canvas"
              href={certificateUrl}
              rel="noreferrer"
              target="_blank"
            >
              {content.downloadCertificate}
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          ) : null}
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-accent px-4 text-sm font-semibold text-white no-underline hover:bg-accent-hover"
            href={localizedRoute(locale, `/verify?proofId=${proof.proofId}`)}
          >
            {content.verifyThisProof}
          </Link>
          <p className="mb-0 text-xs leading-5 text-ink-tertiary">{content.resultDisclaimer}</p>
        </aside>
      </div>
    </article>
  );
}

function Fact({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium text-ink-tertiary">{label}</dt>
      <dd className={`mt-2 mb-0 break-all ${mono ? "font-mono text-xs leading-5" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}

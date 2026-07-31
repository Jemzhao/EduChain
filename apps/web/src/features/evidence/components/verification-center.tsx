"use client";

import type { components } from "@educhain/api-contract";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileKey2, ShieldAlert, Upload } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { createVerification } from "@/data-access/mutations/evidence";
import { evidenceRoute } from "@/lib/routing/localized-route";

type VerificationResult = components["schemas"]["VerificationResult"];

const sha256Pattern = /^[a-fA-F0-9]{64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const transactionPattern = /^[a-zA-Z0-9._:-]{16,160}$/;

export function VerificationCenter({ locale }: { locale: string }) {
  const content = useIntlayer("evidence");
  const searchParams = useSearchParams();
  const [proofId, setProofId] = useState(
    searchParams.get("proofId") ?? searchParams.get("transactionId") ?? "",
  );
  const [digest, setDigest] = useState(searchParams.get("digest") ?? "");
  const [fileName, setFileName] = useState<string>();
  const [fileBusy, setFileBusy] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const verification = useMutation({ mutationFn: createVerification });
  const resultLabels: Record<VerificationResult, React.ReactNode> = {
    MATCHED: content.resultMatched,
    MISMATCHED: content.resultMismatched,
    NOT_FOUND: content.resultNotFound,
    PENDING: content.resultPending,
    UNAVAILABLE: content.resultUnavailable,
    INVALID_INPUT: content.resultInvalid,
  };

  async function selectFile(file?: File) {
    if (!file) return;
    setFileBusy(true);
    setValidationError(undefined);
    try {
      const buffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const value = [...new Uint8Array(buffer)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      setDigest(value);
      setFileName(file.name);
    } finally {
      setFileBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedProofId = proofId.trim();
    const normalizedDigest = digest.trim().toLowerCase();
    if (
      normalizedProofId &&
      !uuidPattern.test(normalizedProofId) &&
      !transactionPattern.test(normalizedProofId)
    ) {
      setValidationError(String(content.invalidProofId));
      return;
    }
    if (!sha256Pattern.test(normalizedDigest)) {
      setValidationError(String(content.invalidDigest));
      return;
    }
    setValidationError(undefined);
    verification.mutate({
      proofId: uuidPattern.test(normalizedProofId) ? normalizedProofId : null,
      transactionId:
        normalizedProofId && !uuidPattern.test(normalizedProofId) ? normalizedProofId : null,
      method: fileName ? "FILE" : "DIGEST",
      contentDigest: normalizedDigest,
      originalFileName: fileName ?? null,
    });
  }

  const result = verification.data;
  const matched = result?.result === "MATCHED";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="max-w-3xl">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-5 mb-0 break-words text-4xl leading-[1.12] font-semibold tracking-[-0.045em] text-pretty sm:text-6xl">
          {content.verifyTitle}
        </h1>
        <p className="mt-6 mb-0 text-lg leading-8 text-ink-secondary">
          {content.verifyDescription}
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <form className="rounded-lg border border-border bg-surface p-6 sm:p-8" onSubmit={submit}>
          <label className="block text-sm font-semibold" htmlFor="proof-id">
            {content.proofIdLabel}
          </label>
          <input
            autoComplete="off"
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-mono text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            id="proof-id"
            onChange={(event) => setProofId(event.target.value)}
            placeholder="Proof UUID / Transaction ID"
            value={proofId}
          />
          <p className="mt-2 mb-0 text-xs leading-5 text-ink-tertiary">{content.proofIdHint}</p>

          <label className="mt-7 block text-sm font-semibold" htmlFor="content-digest">
            {content.digestLabel}
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-sm border border-border bg-canvas p-3 font-mono text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            id="content-digest"
            onChange={(event) => {
              setDigest(event.target.value);
              setFileName(undefined);
            }}
            placeholder={String(content.digestPlaceholder)}
            spellCheck={false}
            value={digest}
          />

          <div className="mt-6 rounded-md border border-dashed border-border bg-surface-subtle p-5">
            <label
              className="inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-border bg-surface px-4 text-sm font-semibold hover:bg-canvas"
              htmlFor="evidence-file"
            >
              <Upload aria-hidden="true" className="mr-2 size-4" />
              {content.fileLabel}
            </label>
            <input
              className="sr-only"
              id="evidence-file"
              onChange={(event) => void selectFile(event.target.files?.[0])}
              type="file"
            />
            <p className="mt-3 mb-0 text-xs text-ink-tertiary" role="status">
              {fileBusy
                ? content.fileComputing
                : fileName
                  ? `${content.fileReady} · ${fileName}`
                  : content.privacyDescription}
            </p>
          </div>

          {validationError ? (
            <p className="mt-5 rounded-sm bg-danger-soft p-3 text-sm text-danger" role="alert">
              {validationError}
            </p>
          ) : null}
          {verification.isError ? (
            <p className="mt-5 rounded-sm bg-danger-soft p-3 text-sm text-danger" role="alert">
              {content.requestError}
            </p>
          ) : null}

          <Button className="mt-6 w-full sm:w-auto" disabled={verification.isPending || fileBusy}>
            {verification.isPending ? content.verifying : content.verifyAction}
          </Button>
        </form>

        <aside className="rounded-md bg-surface-subtle p-6">
          <FileKey2 aria-hidden="true" className="size-6 text-accent" />
          <h2 className="mt-5 mb-0 text-base font-semibold">{content.privacyTitle}</h2>
          <p className="mt-3 mb-0 text-sm leading-6 text-ink-secondary">
            {content.privacyDescription}
          </p>
        </aside>
      </div>

      {result ? (
        <section
          aria-live="polite"
          className={`mt-8 rounded-lg border p-6 sm:p-8 ${
            matched ? "border-success/30 bg-success-soft" : "border-border bg-surface"
          }`}
        >
          <div className="flex items-start gap-4">
            {matched ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-success" />
            ) : (
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-warning" />
            )}
            <div>
              <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                {content.resultTitle}
              </p>
              <h2 className="mt-2 mb-0 text-2xl font-semibold">{resultLabels[result.result]}</h2>
              <p className="mt-3 mb-0 break-all font-mono text-xs leading-5 text-ink-secondary">
                {result.checkedDigest}
              </p>
              <p className="mt-5 mb-0 max-w-3xl text-sm leading-6 text-ink-secondary">
                {content.resultDisclaimer}
              </p>
              {result.proof ? (
                <Link
                  className="mt-5 inline-flex min-h-10 items-center font-semibold text-accent no-underline hover:underline"
                  href={evidenceRoute(locale, result.proof.proofId)}
                >
                  {content.viewProof}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";

import { EvidenceDetail } from "./evidence-detail";

export function EvidenceDetailRoute({ locale }: { locale: string }) {
  const proofId = useSearchParams().get("proofId") ?? "";

  return <EvidenceDetail locale={locale} proofId={proofId} />;
}

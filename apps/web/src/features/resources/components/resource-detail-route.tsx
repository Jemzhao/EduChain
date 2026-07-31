"use client";

import { useSearchParams } from "next/navigation";

import { ResourceDetail } from "./resource-detail";

export function ResourceDetailRoute({ locale }: { locale: string }) {
  const resourceKey = useSearchParams().get("resourceKey") ?? "";

  return <ResourceDetail locale={locale} resourceKey={resourceKey} />;
}

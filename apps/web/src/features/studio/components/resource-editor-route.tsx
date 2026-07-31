"use client";

import { useSearchParams } from "next/navigation";

import { ResourceEditor } from "./resource-editor";

export function ResourceEditorRoute({ locale }: { locale: string }) {
  const resourceId = useSearchParams().get("resourceId") ?? "";

  return <ResourceEditor locale={locale} resourceId={resourceId} />;
}

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { ApiError } from "@/data-access/http/api-error";
import { getResourceDraft } from "@/data-access/queries/resources";
import { localizedRoute } from "@/lib/routing/localized-route";

import { LoadedResourceEditor } from "./resource-editor-view";

export function ResourceEditor({ locale, resourceId }: { locale: string; resourceId: string }) {
  const content = useIntlayer("studio");
  const draft = useQuery({
    queryKey: ["resource-draft", resourceId],
    queryFn: () => getResourceDraft(resourceId),
    retry: false,
  });

  if (draft.isPending) {
    return (
      <p className="py-24 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }
  if (!draft.data) {
    const unauthenticated =
      draft.error instanceof ApiError &&
      ["AUTHENTICATION_REQUIRED", "SESSION_EXPIRED"].includes(draft.error.problem.code);
    return (
      <div className="py-24 text-center">
        <p className="m-0 text-danger" role="alert">
          {unauthenticated ? content.authenticationRequired : content.loadError}
        </p>
        {unauthenticated ? (
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
            href={localizedRoute(locale, "/sign-in")}
          >
            {content.signInAction}
          </Link>
        ) : null}
      </div>
    );
  }
  return <LoadedResourceEditor initial={draft.data} locale={locale} resourceId={resourceId} />;
}

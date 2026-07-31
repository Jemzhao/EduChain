"use client";

import type { components } from "@educhain/api-contract";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, FilePenLine, Plus } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { ApiError } from "@/data-access/http/api-error";
import { ConfirmationReasonAction } from "@/components/patterns/confirmation-reason-action";
import { restoreOwnResource, withdrawOwnResource } from "@/data-access/mutations/resources";
import { listMyResources } from "@/data-access/queries/resources";
import { localizedRoute, resourceEditorRoute, resourceRoute } from "@/lib/routing/localized-route";

type ResourceStatus = components["schemas"]["ResourceStatus"];

export function ResourceWorkspace({ locale }: { locale: string }) {
  const content = useIntlayer("studio");
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ResourceStatus>();
  const resources = useQuery({
    queryKey: ["my-resources", status ?? "ALL"],
    queryFn: () => listMyResources(status),
    retry: false,
  });

  const statusCopy: Record<ResourceStatus, unknown> = {
    DRAFT: content.draftStatus,
    PUBLISHED: content.publishedStatus,
    WITHDRAWN: content.withdrawnStatus,
  };
  const filters: Array<{ value?: ResourceStatus; label: unknown }> = [
    { label: content.allResources },
    { value: "DRAFT", label: content.draftResources },
    { value: "PUBLISHED", label: content.publishedResources },
    { value: "WITHDRAWN", label: content.withdrawnResources },
  ];

  if (
    resources.error instanceof ApiError &&
    ["AUTHENTICATION_REQUIRED", "SESSION_EXPIRED"].includes(resources.error.problem.code)
  ) {
    return (
      <div className="py-24 text-center">
        <p className="m-0 text-danger">{content.authenticationRequired}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signInAction}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
            {content.newEyebrow}
          </p>
          <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.04em]">
            {content.workspaceTitle}
          </h1>
          <p className="mt-4 leading-7 text-ink-secondary">{content.workspaceDescription}</p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/studio/resources/new")}
        >
          <Plus aria-hidden="true" className="size-4" />
          {content.newResourceAction}
        </Link>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="group">
        {filters.map((filter) => (
          <button
            aria-pressed={status === filter.value}
            className={`min-h-10 rounded-[var(--ed-radius-pill)] border px-4 text-sm font-semibold ${status === filter.value ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-ink-secondary hover:border-border-strong"}`}
            key={filter.value ?? "ALL"}
            onClick={() => setStatus(filter.value)}
            type="button"
          >
            {String(filter.label)}
          </button>
        ))}
      </div>

      {resources.isPending ? (
        <p className="py-20 text-center text-ink-secondary">{content.loading}</p>
      ) : resources.isError ? (
        <p className="py-20 text-center text-danger" role="alert">
          {content.workspaceError}
        </p>
      ) : resources.data.items.length === 0 ? (
        <section className="mt-8 rounded-md border border-dashed border-border p-12 text-center">
          <FilePenLine aria-hidden="true" className="mx-auto size-8 text-accent" />
          <h2 className="mt-5 mb-0 text-2xl font-semibold">{content.workspaceEmptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-ink-secondary">
            {content.workspaceEmptyDescription}
          </p>
        </section>
      ) : (
        <ul className="mt-8 grid list-none gap-4 p-0 md:grid-cols-2">
          {resources.data.items.map((resource) => (
            <li
              className="rounded-md border border-border bg-surface p-6 transition-colors hover:border-border-strong"
              key={resource.resourceId}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-[var(--ed-radius-pill)] bg-surface-subtle px-3 py-1 text-xs font-semibold text-ink-secondary">
                  {String(statusCopy[resource.status])}
                </span>
                {resource.publicVersionNumber ? (
                  <span className="text-xs text-ink-tertiary">
                    {content.versionLabel} {resource.publicVersionNumber}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-5 mb-0 text-xl font-semibold tracking-[-0.025em]">
                {resource.title || content.untitledResource}
              </h2>
              <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-ink-secondary">
                {resource.summary || content.privateNote}
              </p>
              <p className="mt-5 mb-0 text-xs text-ink-tertiary">
                {content.lastSavedLabel} ·{" "}
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(resource.savedAt))}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
                {resource.status !== "WITHDRAWN" ? (
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent no-underline hover:underline"
                    href={resourceEditorRoute(locale, resource.resourceId)}
                  >
                    <FilePenLine aria-hidden="true" className="size-4" />
                    {content.continueEditing}
                  </Link>
                ) : null}
                {resource.status === "PUBLISHED" ? (
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary no-underline hover:text-ink"
                    href={resourceRoute(locale, resource.slug)}
                  >
                    {content.viewPublished}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : null}
                {resource.status === "PUBLISHED" || resource.status === "WITHDRAWN" ? (
                  <ConfirmationReasonAction
                    actionLabel={
                      resource.status === "PUBLISHED"
                        ? content.withdrawResource
                        : content.restoreResource
                    }
                    cancelLabel={content.lifecycleCancel}
                    confirmLabel={content.lifecycleConfirm}
                    failedLabel={content.lifecycleFailed}
                    impact={content.lifecycleImpact}
                    onConfirm={async (reason) => {
                      if (resource.status === "PUBLISHED") {
                        await withdrawOwnResource(resource.resourceId, reason);
                      } else {
                        await restoreOwnResource(resource.resourceId, reason);
                      }
                      await queryClient.invalidateQueries({ queryKey: ["my-resources"] });
                    }}
                    reasonHint={content.lifecycleReasonHint}
                    reasonLabel={content.lifecycleReason}
                    target={resource.title || content.untitledResource}
                    variant="secondary"
                    workingLabel={content.lifecycleWorking}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useMutation } from "@tanstack/react-query";
import type { components } from "@educhain/api-contract";
import { FileText, Link2, LockKeyhole, PlaySquare, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { createResourceDraft } from "@/data-access/mutations/resources";
import { localizedRoute } from "@/lib/routing/localized-route";

export function NewResource({ locale }: { locale: string }) {
  const content = useIntlayer("studio");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] =
    useState<components["schemas"]["ResourceType"]>("ARTICLE");
  const createDraft = useMutation({
    mutationFn: () => createResourceDraft({ title: title.trim(), resourceType }),
    onSuccess: (draft) => {
      router.push(localizedRoute(locale, `/studio/resources/${draft.resourceId}/edit`));
    },
  });

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-md border border-border bg-surface lg:grid-cols-[1fr_17rem]">
      <section className="p-7 sm:p-12">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.newEyebrow}
        </p>
        <h1 className="mt-5 mb-0 text-4xl font-semibold tracking-[-0.04em] text-balance">
          {content.newTitle}
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-ink-secondary">{content.newDescription}</p>
        <div className="mt-9 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">{content.resourceTypeLabel}</legend>
            <p className="mt-1 text-xs leading-5 text-ink-tertiary">
              {content.resourceTypeDescription}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "ARTICLE" as const,
                  icon: ScrollText,
                  label: content.typeArticle,
                  description: content.typeArticleDescription,
                },
                {
                  value: "DOCUMENT" as const,
                  icon: FileText,
                  label: content.typeDocument,
                  description: content.typeDocumentDescription,
                },
                {
                  value: "VIDEO" as const,
                  icon: PlaySquare,
                  label: content.typeVideo,
                  description: content.typeVideoDescription,
                },
                {
                  value: "LINK" as const,
                  icon: Link2,
                  label: content.typeLink,
                  description: content.typeLinkDescription,
                },
              ].map((option) => (
                <label
                  className={`cursor-pointer rounded-sm border p-4 ${resourceType === option.value ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong"}`}
                  key={option.value}
                >
                  <input
                    checked={resourceType === option.value}
                    className="sr-only"
                    name="resource-type"
                    onChange={() => setResourceType(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <option.icon aria-hidden="true" className="size-4 text-accent" />
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink-tertiary">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <FormField
            id="working-title"
            inputProps={{
              maxLength: 160,
              onChange: (event) => setTitle(event.target.value),
              placeholder: String(content.initialTitlePlaceholder),
              value: title,
            }}
            label={String(content.initialTitleLabel)}
          />
          {createDraft.isError ? (
            <p className="rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
              {content.requestError}
            </p>
          ) : null}
          <Button
            disabled={createDraft.isPending}
            onClick={() => createDraft.mutate()}
            type="button"
          >
            {createDraft.isPending ? content.creatingAction : content.createAction}
          </Button>
        </div>
      </section>
      <aside className="border-t border-border bg-surface-subtle p-7 sm:p-10 lg:border-t-0 lg:border-l">
        <span className="flex size-10 items-center justify-center rounded-sm bg-accent-soft text-accent">
          <LockKeyhole aria-hidden="true" className="size-4" />
        </span>
        <p className="mt-6 mb-0 text-sm leading-6 text-ink-secondary">{content.privateNote}</p>
      </aside>
    </div>
  );
}

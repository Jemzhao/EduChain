import { Check, Circle, FileText, Image as ImageIcon, Upload } from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { MarkdownArticle } from "@/features/resources/components/markdown-article";
import { categoryName } from "@/features/taxonomy/category-copy";

import type { DraftResponse } from "./use-resource-editor";
import { useResourceEditor } from "./use-resource-editor";

export function LoadedResourceEditor({
  initial,
  locale,
  resourceId,
}: {
  initial: DraftResponse;
  locale: string;
  resourceId: string;
}) {
  const {
    categories,
    content,
    coverName,
    editor,
    publication,
    publishable,
    removeAttachment,
    requirements,
    restoration,
    saveDraft,
    saveNow,
    saveStatus,
    selectedTags,
    statusCopy,
    tags,
    taxonomy,
    textFirst,
    toggleTag,
    updateEditor,
    uploadFile,
    versions,
  } = useResourceEditor({ initial, locale, resourceId });

  return (
    <div>
      <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
            {content.editorEyebrow}
          </p>
          <h1 className="mt-4 mb-0 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {content.editorTitle}
          </h1>
          <p className="mt-3 leading-7 text-ink-secondary">{content.editorDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p
            className={`m-0 text-sm ${saveStatus === "error" || saveStatus === "conflict" ? "text-danger" : saveStatus === "saved" ? "text-success" : "text-ink-secondary"}`}
            aria-live="polite"
          >
            {statusCopy}
          </p>
          <Button
            disabled={saveDraft.isPending || saveStatus === "saved"}
            onClick={saveNow}
            type="button"
            variant="secondary"
          >
            {content.saveNow}
          </Button>
        </div>
      </header>

      <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-md border border-border bg-surface p-6 sm:p-8">
            <div className="inline-flex rounded-[var(--ed-radius-pill)] bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {
                {
                  ARTICLE: content.typeArticle,
                  DOCUMENT: content.typeDocument,
                  VIDEO: content.typeVideo,
                  LINK: content.typeLink,
                }[initial.resourceType]
              }
            </div>
            <FormField
              id="resource-title"
              inputProps={{
                maxLength: 160,
                onChange: (event) => updateEditor({ title: event.target.value }),
                placeholder: String(content.titlePlaceholder),
                value: editor.title,
              }}
              label={String(content.titleLabel)}
            />
            <FormField
              id="resource-summary"
              inputProps={{
                maxLength: 600,
                onChange: (event) => updateEditor({ summary: event.target.value }),
                placeholder: String(content.summaryPlaceholder),
                value: editor.summary,
              }}
              label={String(content.summaryLabel)}
              multiline
            />
            {!textFirst ? (
              <FormField
                description={String(content.sourceUrlDescription)}
                id="resource-source-url"
                inputProps={{
                  inputMode: "url",
                  maxLength: 2048,
                  onChange: (event) => updateEditor({ sourceUrl: event.target.value }),
                  placeholder: "https://",
                  type: "url",
                  value: editor.sourceUrl,
                }}
                label={String(content.sourceUrlLabel)}
              />
            ) : null}
            <FormField
              description={String(content.bodyDescription)}
              id="resource-body"
              inputProps={{
                className: "min-h-72 font-mono text-sm leading-6",
                maxLength: 100_000,
                onChange: (event) => updateEditor({ body: event.target.value }),
                value: editor.body,
              }}
              label={String(content.bodyLabel)}
              multiline
            />
          </section>

          <section className="grid gap-6 rounded-md border border-border bg-surface p-6 sm:p-8 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              {content.categoryLabel}
              <select
                className="mt-2 min-h-12 w-full rounded-sm border border-border bg-surface px-3 font-normal"
                onChange={(event) => updateEditor({ categoryId: event.target.value || null })}
                value={editor.categoryId ?? ""}
              >
                <option value="">{content.categoryPlaceholder}</option>
                {categories.data?.items.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryName(taxonomy, category.slug, category.nameKey)}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="m-0 text-sm font-semibold">{content.tagsLabel}</p>
              <p className="mt-1 text-xs text-ink-tertiary">{content.tagsDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.data?.items.map((tag) => (
                  <label
                    className={`cursor-pointer rounded-[var(--ed-radius-pill)] border px-3 py-1.5 text-xs ${selectedTags.has(tag.id) ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-secondary"}`}
                    key={tag.id}
                  >
                    <input
                      checked={selectedTags.has(tag.id)}
                      className="sr-only"
                      disabled={!selectedTags.has(tag.id) && editor.tagIds.length >= 8}
                      onChange={() => toggleTag(tag.id)}
                      type="checkbox"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <FormField
                id="resource-copyright"
                inputProps={{
                  maxLength: 500,
                  onChange: (event) => updateEditor({ copyrightStatement: event.target.value }),
                  placeholder: String(content.copyrightPlaceholder),
                  value: editor.copyrightStatement,
                }}
                label={String(content.copyrightLabel)}
                multiline
              />
            </div>
          </section>

          <section className="grid gap-6 rounded-md border border-border bg-surface p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="m-0 text-sm font-semibold">{content.coverLabel}</p>
              <p className="mt-1 text-xs leading-5 text-ink-tertiary">{content.coverDescription}</p>
              <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-subtle">
                <ImageIcon aria-hidden="true" className="size-4" />
                {content.chooseCover}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadFile.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadFile.mutate({ file, kind: "cover" });
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
              {coverName ? (
                <p className="mt-3 truncate text-xs text-ink-secondary">{coverName}</p>
              ) : null}
            </div>
            <div>
              <p className="m-0 text-sm font-semibold">{content.attachmentLabel}</p>
              <p className="mt-1 text-xs leading-5 text-ink-tertiary">
                {content.attachmentDescription}
              </p>
              <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-subtle">
                <Upload aria-hidden="true" className="size-4" />
                {uploadFile.isPending ? content.uploading : content.addAttachment}
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp,video/mp4,text/plain,text/markdown"
                  className="sr-only"
                  disabled={uploadFile.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadFile.mutate({ file, kind: "attachment" });
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
              {uploadFile.isError ? (
                <p className="mt-3 text-xs text-danger" role="alert">
                  {content.uploadError}
                </p>
              ) : null}
            </div>
            {editor.attachments.length > 0 ? (
              <ul className="m-0 list-none space-y-2 p-0 md:col-span-2">
                {editor.attachments.map((file) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-sm bg-surface-subtle p-3"
                    key={file.fileId}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText aria-hidden="true" className="size-4 shrink-0 text-accent" />
                      <span className="truncate">{file.displayName}</span>
                    </span>
                    <button
                      className="border-0 bg-transparent text-xs font-medium text-ink-tertiary hover:text-danger"
                      onClick={() => removeAttachment(file.fileId)}
                      type="button"
                    >
                      {content.removeAttachment}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-md border border-border bg-surface p-6">
            <p className="m-0 text-xs font-semibold tracking-[0.08em] text-accent uppercase">
              {content.previewLabel}
            </p>
            <h2 className="mt-4 mb-0 text-2xl font-semibold tracking-[-0.03em]">
              {editor.title || content.titlePlaceholder}
            </h2>
            {editor.summary ? (
              <p className="mt-3 leading-7 text-ink-secondary">{editor.summary}</p>
            ) : null}
            <div className="mt-6 border-t border-border pt-6">
              {editor.body ? (
                <MarkdownArticle body={editor.body} />
              ) : (
                <p className="text-sm text-ink-tertiary">{content.previewEmpty}</p>
              )}
            </div>
          </section>
          {initial.status === "PUBLISHED" ? (
            <section className="rounded-md border border-border bg-surface p-6">
              <h2 className="m-0 text-base font-semibold">{content.historyTitle}</h2>
              <p className="mt-2 text-xs leading-5 text-ink-tertiary">
                {content.historyDescription}
              </p>
              {versions.isPending ? (
                <p className="mt-5 text-sm text-ink-secondary">{content.historyLoading}</p>
              ) : versions.data?.items.length ? (
                <ul className="mt-5 list-none divide-y divide-border p-0">
                  {versions.data.items.map((version) => (
                    <li className="py-4 first:pt-0 last:pb-0" key={version.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-semibold">
                            v{version.versionNumber} · {version.title}
                          </p>
                          <p className="mt-1 mb-0 text-xs text-ink-tertiary">
                            {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                              new Date(version.publishedAt),
                            )}
                          </p>
                        </div>
                        {version.current ? (
                          <span className="shrink-0 rounded-[var(--ed-radius-pill)] bg-success-soft px-2 py-1 text-[0.7rem] font-semibold text-success">
                            {content.currentVersion}
                          </span>
                        ) : null}
                      </div>
                      <button
                        className="mt-3 border-0 bg-transparent p-0 text-xs font-semibold text-accent hover:underline disabled:opacity-55"
                        disabled={restoration.isPending}
                        onClick={() => restoration.mutate(version.id)}
                        type="button"
                      >
                        {restoration.isPending && restoration.variables === version.id
                          ? content.restoringVersion
                          : content.restoreVersion}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-ink-tertiary">{content.historyEmpty}</p>
              )}
              {restoration.isError ? (
                <p className="mt-4 text-sm text-danger" role="alert">
                  {content.restoreError}
                </p>
              ) : null}
            </section>
          ) : null}
          <section className="rounded-md border border-border bg-surface-subtle p-6">
            <h2 className="m-0 text-base font-semibold">{content.publishChecklist}</h2>
            <ul className="mt-5 list-none space-y-3 p-0">
              {requirements.map((requirement) => (
                <li
                  className={`flex items-center gap-3 text-sm ${requirement.met ? "text-ink" : "text-ink-tertiary"}`}
                  key={String(requirement.label)}
                >
                  {requirement.met ? (
                    <span className="flex size-5 items-center justify-center rounded-[var(--ed-radius-pill)] bg-success-soft text-success">
                      <Check aria-hidden="true" className="size-3" />
                    </span>
                  ) : (
                    <Circle aria-hidden="true" className="size-5" />
                  )}
                  {requirement.label}
                </li>
              ))}
            </ul>
            {publication.isError ? (
              <p
                className="mt-5 rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger"
                role="alert"
              >
                {content.publishError}
              </p>
            ) : null}
            <Button
              className="mt-6 w-full"
              disabled={!publishable || publication.isPending}
              onClick={() => publication.mutate()}
              type="button"
            >
              {publication.isPending ? content.publishingAction : content.publishAction}
            </Button>
            <p className="mt-3 mb-0 text-xs leading-5 text-ink-tertiary">{content.publishHint}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

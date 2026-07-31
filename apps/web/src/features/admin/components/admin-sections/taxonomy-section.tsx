"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Button } from "@/components/primitives/button";
import {
  createAdminCategory,
  createAdminTag,
  deleteAdminTaxonomyItem,
  deleteAdminTaxonomyItems,
  mergeAdminTaxonomy,
  updateAdminTaxonomyStatus,
  updateAdminCategory,
  updateAdminTag,
} from "@/data-access/mutations/admin";
import { getAdminTaxonomy } from "@/data-access/queries/admin";
import { categoryDescription, categoryName } from "@/features/taxonomy/category-copy";
import {
  GovernanceAction,
  Loading,
  LoadError,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

type AdminTaxonomyItem = components["schemas"]["AdminTaxonomyItem"];
type TaxonomyCopy = Parameters<typeof categoryName>[0];

function taxonomyItemLabel(item: AdminTaxonomyItem, taxonomy: TaxonomyCopy) {
  return item.kind === "CATEGORY" && /^category\.[^.]+\.name$/.test(item.label)
    ? categoryName(taxonomy, item.slug, item.label)
    : item.label;
}

function taxonomyItemDescription(item: AdminTaxonomyItem, taxonomy: TaxonomyCopy) {
  return item.kind === "CATEGORY" && /^category\.[^.]+\.description$/.test(item.description)
    ? categoryDescription(taxonomy, item.slug, item.description)
    : item.description;
}

export function TaxonomySection({ administrator }: { administrator: boolean }) {
  const content = useIntlayer("admin");
  const taxonomy = useIntlayer("taxonomy");
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<
    { kind: "CATEGORY" | "TAG"; item?: components["schemas"]["AdminTaxonomyItem"] } | undefined
  >();
  const [selected, setSelected] = useState<components["schemas"]["AdminTaxonomyDeletionRef"][]>([]);
  const query = useQuery({
    queryKey: ["admin", "taxonomy"],
    queryFn: getAdminTaxonomy,
    retry: false,
  });
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  return (
    <div>
      <SectionHeader title={content.taxonomyTitle} description={content.taxonomyDescription} />
      {administrator ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setEditor({ kind: "CATEGORY" })} type="button">
            {content.createCategory}
          </Button>
          <Button onClick={() => setEditor({ kind: "TAG" })} type="button" variant="secondary">
            {content.createTag}
          </Button>
          {selected.length ? (
            <GovernanceAction
              actionLabel={`${String(content.deleteSelected)} (${selected.length})`}
              onConfirm={async (reason) => {
                await deleteAdminTaxonomyItems(selected, reason);
                setSelected([]);
                await queryClient.invalidateQueries({ queryKey: ["admin"] });
                await queryClient.invalidateQueries({ queryKey: ["categories"] });
                await queryClient.invalidateQueries({ queryKey: ["tags"] });
              }}
              target={`${selected.length} ${String(content.taxonomy)}`}
              variant="danger"
            />
          ) : null}
        </div>
      ) : null}
      {editor ? (
        <TaxonomyEditor
          categories={query.data.items.filter((item) => item.kind === "CATEGORY")}
          editor={editor}
          key={`${editor.kind}:${editor.item?.id ?? "new"}`}
          onCancel={() => setEditor(undefined)}
          onSaved={async () => {
            setEditor(undefined);
            await queryClient.invalidateQueries({ queryKey: ["admin"] });
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
            await queryClient.invalidateQueries({ queryKey: ["tags"] });
          }}
        />
      ) : null}
      <ResponsiveTable
        columns={[
          "",
          content.typeLabel,
          content.resourceLabel,
          content.statusLabel,
          content.referencesLabel,
          "",
        ]}
      >
        {query.data.items.map((item) => {
          const itemLabel = taxonomyItemLabel(item, taxonomy);
          const protectedItem = item.status === "ACTIVE" && item.referenceCount > 0;
          const mergeTarget = item.mergedIntoId
            ? query.data.items.find((candidate) => candidate.id === item.mergedIntoId)
            : undefined;
          return (
            <tr className="border-t border-border" key={item.id}>
              <td className="w-12 px-4 py-4">
                {administrator && item.status === "DISABLED" && item.referenceCount === 0 ? (
                  <input
                    aria-label={`${String(content.selectTaxonomy)} ${String(itemLabel)}`}
                    checked={selected.some((candidate) => candidate.id === item.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, { id: item.id, kind: item.kind, version: item.version }]
                          : current.filter((candidate) => candidate.id !== item.id),
                      )
                    }
                    type="checkbox"
                  />
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-ink-tertiary">
                {statusText(item.kind, content)}
              </td>
              <td className="min-w-56 px-4 py-4">
                <p className="m-0 font-semibold">{itemLabel}</p>
                <p className="mt-1 mb-0 text-xs text-ink-tertiary">{item.slug}</p>
                {mergeTarget ? (
                  <p className="mt-1 mb-0 text-xs font-medium text-accent">
                    {content.mergedInto}: {taxonomyItemLabel(mergeTarget, taxonomy)}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-4">
                <StatusBadge>{statusText(item.status, content)}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-sm text-ink-secondary">{item.referenceCount}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex min-w-[24rem] max-w-[28rem] flex-wrap justify-end gap-2">
                  {administrator && !item.mergedIntoId ? (
                    <Button
                      onClick={() => setEditor({ kind: item.kind, item })}
                      type="button"
                      variant="quiet"
                    >
                      {content.editItem}
                    </Button>
                  ) : null}
                  {administrator && !item.mergedIntoId ? (
                    <TaxonomyMergeAction
                      candidates={query.data.items.filter(
                        (candidate) =>
                          candidate.kind === item.kind &&
                          candidate.id !== item.id &&
                          candidate.status === "ACTIVE",
                      )}
                      item={item}
                      onDone={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}
                    />
                  ) : null}
                  {protectedItem ? (
                    <span className="self-center whitespace-nowrap text-xs text-ink-tertiary">
                      {content.referencedProtected}
                    </span>
                  ) : administrator && !item.mergedIntoId ? (
                    <GovernanceAction
                      actionLabel={
                        item.status === "ACTIVE" ? content.disableItem : content.enableItem
                      }
                      onConfirm={async (reason) => {
                        await updateAdminTaxonomyStatus(
                          item,
                          item.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                          reason,
                        );
                        await queryClient.invalidateQueries({ queryKey: ["admin"] });
                      }}
                      target={itemLabel}
                      variant="secondary"
                    />
                  ) : null}
                  {administrator && item.status === "DISABLED" && item.referenceCount === 0 ? (
                    <GovernanceAction
                      actionLabel={content.deleteItem}
                      onConfirm={async (reason) => {
                        await deleteAdminTaxonomyItem(
                          { id: item.id, kind: item.kind, version: item.version },
                          reason,
                        );
                        setSelected((current) =>
                          current.filter((candidate) => candidate.id !== item.id),
                        );
                        await queryClient.invalidateQueries({ queryKey: ["admin"] });
                        await queryClient.invalidateQueries({ queryKey: ["categories"] });
                        await queryClient.invalidateQueries({ queryKey: ["tags"] });
                      }}
                      target={itemLabel}
                      variant="danger"
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </ResponsiveTable>
    </div>
  );
}

function TaxonomyMergeAction({
  item,
  candidates,
  onDone,
}: {
  item: components["schemas"]["AdminTaxonomyItem"];
  candidates: components["schemas"]["AdminTaxonomyItem"][];
  onDone: () => Promise<unknown>;
}) {
  const content = useIntlayer("admin");
  const taxonomy = useIntlayer("taxonomy");
  const [targetId, setTargetId] = useState(candidates[0]?.id ?? "");
  if (candidates.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label className="sr-only" htmlFor={`merge-${item.id}`}>
        {content.mergeTarget}
      </label>
      <select
        className="min-h-10 w-44 rounded-sm border border-border bg-canvas px-2 text-xs"
        id={`merge-${item.id}`}
        onChange={(event) => setTargetId(event.target.value)}
        value={targetId}
      >
        {candidates.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {taxonomyItemLabel(candidate, taxonomy)}
          </option>
        ))}
      </select>
      <GovernanceAction
        actionLabel={content.mergeItem}
        onConfirm={async (reason) => {
          await mergeAdminTaxonomy(item, targetId, reason);
          await onDone();
        }}
        target={taxonomyItemLabel(item, taxonomy)}
        variant="secondary"
      />
    </div>
  );
}

function TaxonomyEditor({
  categories,
  editor,
  onCancel,
  onSaved,
}: {
  categories: components["schemas"]["AdminTaxonomyItem"][];
  editor: {
    kind: "CATEGORY" | "TAG";
    item?: components["schemas"]["AdminTaxonomyItem"];
  };
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const content = useIntlayer("admin");
  const taxonomy = useIntlayer("taxonomy");
  const [slug, setSlug] = useState(editor.item?.slug ?? "");
  const [label, setLabel] = useState(
    editor.item ? String(taxonomyItemLabel(editor.item, taxonomy)) : "",
  );
  const [description, setDescription] = useState(
    editor.item ? String(taxonomyItemDescription(editor.item, taxonomy)) : "",
  );
  const [parentId, setParentId] = useState(editor.item?.parentId ?? "");
  const [order, setOrder] = useState(editor.item?.order ?? 0);
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: async () => {
      if (editor.kind === "CATEGORY") {
        const body = {
          slug: slug.trim(),
          label: label.trim(),
          description: description.trim(),
          parentId: parentId || null,
          order,
          reason: reason.trim(),
        };
        return editor.item
          ? updateAdminCategory(editor.item.id, editor.item.version, body)
          : createAdminCategory(body);
      }
      const body = {
        slug: slug.trim(),
        label: label.trim(),
        description: description.trim(),
        reason: reason.trim(),
      };
      return editor.item
        ? updateAdminTag(editor.item.id, editor.item.version, body)
        : createAdminTag(body);
    },
    onSuccess: onSaved,
  });
  const valid =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim()) &&
    Boolean(label.trim()) &&
    reason.trim().length >= 10;

  return (
    <form
      className="mt-6 rounded-md border border-border bg-surface-subtle p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) save.mutate();
      }}
    >
      <h2 className="m-0 text-lg font-semibold">
        {editor.item
          ? content.editItem
          : editor.kind === "CATEGORY"
            ? content.createCategory
            : content.createTag}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          {content.slugLabel}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 font-normal"
            maxLength={80}
            onChange={(event) => setSlug(event.target.value)}
            value={slug}
          />
        </label>
        <label className="text-sm font-semibold">
          {content.nameLabel}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 font-normal"
            maxLength={editor.kind === "CATEGORY" ? 120 : 80}
            onChange={(event) => setLabel(event.target.value)}
            value={label}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          {content.itemDescriptionLabel}
          <textarea
            className="mt-2 min-h-24 w-full rounded-sm border border-border bg-surface p-3 font-normal"
            maxLength={240}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>
        {editor.kind === "CATEGORY" ? (
          <>
            <label className="text-sm font-semibold">
              {content.parentCategoryLabel}
              <select
                className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 font-normal"
                onChange={(event) => setParentId(event.target.value)}
                value={parentId}
              >
                <option value="">{content.noParentCategory}</option>
                {categories
                  .filter((category) => category.id !== editor.item?.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {taxonomyItemLabel(category, taxonomy)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {content.orderLabel}
              <input
                className="mt-2 min-h-11 w-full rounded-sm border border-border bg-surface px-3 font-normal"
                min={0}
                onChange={(event) => setOrder(Number(event.target.value))}
                type="number"
                value={order}
              />
            </label>
          </>
        ) : null}
        <label className="text-sm font-semibold sm:col-span-2">
          {content.actionReasonLabel}
          <textarea
            className="mt-2 min-h-24 w-full rounded-sm border border-border bg-surface p-3 font-normal"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
          <span className="mt-1 block text-xs font-normal text-ink-tertiary">
            {content.actionReasonHint}
          </span>
        </label>
      </div>
      {save.isError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {content.actionFailed}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="quiet">
          {content.cancel}
        </Button>
        <Button disabled={!valid || save.isPending} type="submit">
          {save.isPending ? content.savingAction : content.saveAction}
        </Button>
      </div>
    </form>
  );
}

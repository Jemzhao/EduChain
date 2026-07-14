"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Folder, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import {
  createCollection,
  deleteCollection,
  removeCollectionItem,
  updateCollection,
} from "@/data-access/mutations/community";
import { getCollectionItems, getCollections } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { ResourceCard } from "@/features/resources/components/resource-card";
import { localizedRoute } from "@/lib/routing/localized-route";

export function LibraryPage({ locale }: { locale: string }) {
  const content = useIntlayer("library");
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState<string>();
  const [pendingDelete, setPendingDelete] = useState(false);
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const collections = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(),
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const selected =
    collections.data?.items.find((item) => item.id === selectedCollectionId) ??
    collections.data?.items[0];
  const items = useQuery({
    queryKey: ["collection-items", selected?.id],
    queryFn: () => getCollectionItems(selected!.id),
    enabled: Boolean(selected),
    retry: false,
  });

  const refreshLibrary = () => {
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    queryClient.invalidateQueries({ queryKey: ["collection-items"] });
  };
  const create = useMutation({
    mutationFn: () => createCollection(newName.trim()),
    onSuccess: (created) => {
      setNewName("");
      setSelectedCollectionId(created.id);
      refreshLibrary();
    },
  });
  const rename = useMutation({
    mutationFn: () => updateCollection(selected!.id, renameValue!.trim(), selected!.version),
    onSuccess: () => {
      setRenameValue(undefined);
      refreshLibrary();
    },
  });
  const removeCollection = useMutation({
    mutationFn: () => deleteCollection(selected!.id),
    onSuccess: () => {
      setPendingDelete(false);
      setSelectedCollectionId(undefined);
      refreshLibrary();
    },
  });
  const removeItem = useMutation({
    mutationFn: (resourceId: string) => removeCollectionItem(selected!.id, resourceId),
    onSuccess: refreshLibrary,
  });

  if (currentUser.isPending || (currentUser.data && collections.isPending)) {
    return (
      <p className="py-24 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }
  if (!currentUser.data) {
    return (
      <div className="py-24 text-center">
        <p className="m-0 text-ink-secondary">{content.authenticationRequired}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.authenticationRequired}
        </Link>
      </div>
    );
  }
  if (collections.isError || !collections.data) {
    return (
      <p className="py-24 text-center text-danger" role="alert">
        {content.error}
      </p>
    );
  }

  const mutationFailed =
    create.isError || rename.isError || removeCollection.isError || removeItem.isError;

  return (
    <div>
      <header className="max-w-3xl border-b border-border pb-9">
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-secondary">{content.description}</p>
      </header>

      <div className="grid gap-8 py-9 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-md border border-border bg-surface p-4 lg:sticky lg:top-5">
          <nav aria-label={String(content.title)} className="space-y-1">
            {collections.data.items.map((collection) => (
              <button
                aria-current={selected?.id === collection.id ? "page" : undefined}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-sm border-0 px-3 text-left text-sm ${
                  selected?.id === collection.id
                    ? "bg-accent-soft font-semibold text-accent"
                    : "bg-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                }`}
                key={collection.id}
                onClick={() => {
                  setSelectedCollectionId(collection.id);
                  setRenameValue(undefined);
                  setPendingDelete(false);
                }}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {collection.defaultCollection ? (
                    <Bookmark aria-hidden="true" className="size-4 shrink-0" />
                  ) : (
                    <Folder aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {collection.defaultCollection && !collection.name
                      ? content.defaultCollection
                      : collection.name}
                  </span>
                </span>
                <span className="text-xs opacity-70">{collection.itemCount}</span>
              </button>
            ))}
          </nav>

          <form
            className="mt-4 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (newName.trim()) create.mutate();
            }}
          >
            <label className="text-xs font-semibold text-ink-secondary" htmlFor="collection-name">
              {content.newCollection}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                className="min-h-10 min-w-0 flex-1 rounded-sm border border-border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                id="collection-name"
                maxLength={60}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={String(content.namePlaceholder)}
                value={newName}
              />
              <button
                aria-label={String(content.createAction)}
                className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface hover:bg-surface-subtle"
                disabled={!newName.trim() || create.isPending}
                type="submit"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          </form>
        </aside>

        <section>
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-5 border-b border-border pb-5">
                {renameValue === undefined ? (
                  <div>
                    <h2 className="m-0 text-2xl font-semibold tracking-[-0.03em]">
                      {selected.defaultCollection && !selected.name
                        ? content.defaultCollection
                        : selected.name}
                    </h2>
                    <p className="mt-1 mb-0 text-sm text-ink-tertiary">
                      {selected.itemCount} {content.itemUnit}
                    </p>
                  </div>
                ) : (
                  <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (renameValue.trim()) rename.mutate();
                    }}
                  >
                    <label className="sr-only" htmlFor="rename-collection">
                      {content.renameAction}
                    </label>
                    <input
                      className="min-h-11 min-w-0 flex-1 rounded-sm border border-border bg-surface px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
                      id="rename-collection"
                      maxLength={60}
                      onChange={(event) => setRenameValue(event.target.value)}
                      value={renameValue}
                    />
                    <Button disabled={!renameValue.trim() || rename.isPending} type="submit">
                      {content.saveNameAction}
                    </Button>
                  </form>
                )}
                <div className="flex flex-wrap gap-2">
                  {renameValue === undefined ? (
                    <Button
                      onClick={() =>
                        setRenameValue(selected.name || String(content.defaultCollection))
                      }
                      type="button"
                      variant="secondary"
                    >
                      {content.renameAction}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setRenameValue(undefined)}
                      type="button"
                      variant="secondary"
                    >
                      {content.cancelAction}
                    </Button>
                  )}
                  {!selected.defaultCollection ? (
                    pendingDelete ? (
                      <>
                        <Button
                          disabled={removeCollection.isPending}
                          onClick={() => removeCollection.mutate()}
                          type="button"
                          variant="danger"
                        >
                          {content.confirmDelete}
                        </Button>
                        <Button
                          onClick={() => setPendingDelete(false)}
                          type="button"
                          variant="secondary"
                        >
                          {content.cancelAction}
                        </Button>
                      </>
                    ) : (
                      <button
                        aria-label={String(content.deleteAction)}
                        className="flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-ink-tertiary hover:border-danger/40 hover:text-danger"
                        onClick={() => setPendingDelete(true)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    )
                  ) : null}
                </div>
              </div>

              {items.isPending ? (
                <p className="py-20 text-center text-ink-secondary" aria-live="polite">
                  {content.loading}
                </p>
              ) : items.isError ? (
                <p className="py-20 text-center text-danger" role="alert">
                  {content.error}
                </p>
              ) : items.data.items.length === 0 ? (
                <div className="rounded-md border border-dashed border-border py-20 text-center">
                  <Bookmark aria-hidden="true" className="mx-auto size-6 text-ink-tertiary" />
                  <h3 className="mt-4 mb-0 text-lg font-semibold">{content.emptyTitle}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
                    {content.emptyDescription}
                  </p>
                </div>
              ) : (
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {items.data.items.map((item) => (
                    <div className="relative" key={item.resource.id}>
                      <ResourceCard locale={locale} resource={item.resource} />
                      <button
                        aria-label={String(content.removeItem)}
                        className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-sm border border-border bg-surface/95 text-ink-tertiary shadow-sm hover:text-danger"
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(item.resource.id)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>

      {mutationFailed ? (
        <p className="m-0 rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {content.mutationError}
        </p>
      ) : null}
    </div>
  );
}

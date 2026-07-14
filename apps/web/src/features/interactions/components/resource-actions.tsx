"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, Heart } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import {
  addCollectionItem,
  removeCollectionItem,
  setLikeState,
} from "@/data-access/mutations/community";
import { getCollections, getLikeState } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

export function ResourceActions({ locale, resourceId }: { locale: string; resourceId: string }) {
  const content = useIntlayer("interactions");
  const queryClient = useQueryClient();
  const [showCollections, setShowCollections] = useState(false);
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const signedIn = Boolean(currentUser.data);
  const like = useQuery({
    queryKey: ["resource-like", resourceId],
    queryFn: () => getLikeState(resourceId),
    enabled: signedIn,
    retry: false,
  });
  const collections = useQuery({
    queryKey: ["collections", resourceId],
    queryFn: () => getCollections(resourceId),
    enabled: signedIn,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: (liked: boolean) => setLikeState(resourceId, liked),
    onSuccess: (result) => {
      queryClient.setQueryData(["resource-like", resourceId], result);
      queryClient.invalidateQueries({ queryKey: ["search-resources"] });
    },
  });
  const collectionMutation = useMutation({
    mutationFn: async ({ collectionId, saved }: { collectionId: string; saved: boolean }) => {
      if (saved) {
        await removeCollectionItem(collectionId, resourceId);
      } else {
        await addCollectionItem(collectionId, resourceId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection-items"] });
    },
  });

  if (currentUser.isPending) {
    return <div aria-hidden="true" className="h-16 rounded-md bg-surface-subtle" />;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-surface-subtle p-4 sm:p-5">
        <p className="m-0 text-sm text-ink-secondary">{content.signInToInteract}</p>
        <Link
          className="inline-flex min-h-10 items-center rounded-sm border border-border-strong bg-surface px-4 text-sm font-semibold no-underline hover:bg-surface-subtle"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signInAction}
        </Link>
      </div>
    );
  }

  const saved = collections.data?.items.some((collection) => collection.containsResource) ?? false;
  const failed = likeMutation.isError || collectionMutation.isError;

  return (
    <section className="relative rounded-md border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          aria-pressed={like.data?.liked ?? false}
          className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors ${
            like.data?.liked
              ? "border-danger/30 bg-danger-soft text-danger"
              : "border-border bg-surface text-ink hover:bg-surface-subtle"
          }`}
          disabled={likeMutation.isPending || like.isPending}
          onClick={() => likeMutation.mutate(!(like.data?.liked ?? false))}
          type="button"
        >
          <Heart
            aria-hidden="true"
            className="size-4"
            fill={like.data?.liked ? "currentColor" : "none"}
          />
          {like.data?.liked ? content.unlike : content.like}
          <span className="font-normal opacity-70">{like.data?.likeCount ?? 0}</span>
        </button>
        <button
          aria-expanded={showCollections}
          className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors ${
            saved
              ? "border-accent/30 bg-accent-soft text-accent"
              : "border-border bg-surface text-ink hover:bg-surface-subtle"
          }`}
          onClick={() => setShowCollections((visible) => !visible)}
          type="button"
        >
          <Bookmark aria-hidden="true" className="size-4" fill={saved ? "currentColor" : "none"} />
          {content.save}
        </button>
      </div>

      {showCollections ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
            {content.manageSave}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {collections.data?.items.map((collection) => (
              <button
                className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-border bg-surface px-3 text-left text-sm hover:bg-surface-subtle"
                disabled={collectionMutation.isPending}
                key={collection.id}
                onClick={() =>
                  collectionMutation.mutate({
                    collectionId: collection.id,
                    saved: collection.containsResource,
                  })
                }
                type="button"
              >
                <span className="truncate">
                  {collection.defaultCollection ? content.defaultCollection : collection.name}
                </span>
                {collection.containsResource ? (
                  <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {failed ? (
        <p className="mt-3 mb-0 text-sm text-danger" role="alert">
          {content.actionError}
        </p>
      ) : null}
    </section>
  );
}

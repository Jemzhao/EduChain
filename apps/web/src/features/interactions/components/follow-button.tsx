"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, UserPlus } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";

import { setFollowState } from "@/data-access/mutations/community";
import { getFollowState } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

export function FollowButton({
  locale,
  userId,
  handle,
}: {
  locale: string;
  userId: string;
  handle: string;
}) {
  const content = useIntlayer("interactions");
  const queryClient = useQueryClient();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const canFollow = Boolean(currentUser.data && currentUser.data.user.id !== userId);
  const state = useQuery({
    queryKey: ["follow-state", userId],
    queryFn: () => getFollowState(userId),
    enabled: canFollow,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (following: boolean) => setFollowState(userId, following),
    onSuccess: (result) => {
      queryClient.setQueryData(["follow-state", userId], result);
      queryClient.invalidateQueries({ queryKey: ["public-user", handle] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
    },
  });

  if (currentUser.isPending || currentUser.data?.user.id === userId) return null;
  if (!currentUser.data) {
    return (
      <Link
        className="inline-flex min-h-11 items-center rounded-sm border border-border-strong bg-surface px-4 text-sm font-semibold no-underline hover:bg-surface-subtle"
        href={localizedRoute(locale, "/sign-in")}
      >
        {content.follow}
      </Link>
    );
  }

  return (
    <div>
      <button
        aria-pressed={state.data?.following ?? false}
        className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold ${
          state.data?.following
            ? "border-accent/30 bg-accent-soft text-accent"
            : "border-border-strong bg-surface hover:bg-surface-subtle"
        }`}
        disabled={state.isPending || mutation.isPending}
        onClick={() => mutation.mutate(!(state.data?.following ?? false))}
        type="button"
      >
        {state.data?.following ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <UserPlus aria-hidden="true" className="size-4" />
        )}
        {state.data?.following ? content.following : content.follow}
      </button>
      {mutation.isError ? (
        <p className="mt-2 mb-0 text-xs text-danger" role="alert">
          {content.followError}
        </p>
      ) : null}
    </div>
  );
}

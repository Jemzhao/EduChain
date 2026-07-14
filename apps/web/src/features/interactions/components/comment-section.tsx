"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { createComment, deleteComment } from "@/data-access/mutations/community";
import { getResourceComments } from "@/data-access/queries/community";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type Comment = components["schemas"]["CommentResponse"];

export function CommentSection({ locale, resourceId }: { locale: string; resourceId: string }) {
  const content = useIntlayer("interactions");
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment>();
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const comments = useQuery({
    queryKey: ["resource-comments", resourceId],
    queryFn: () => getResourceComments(resourceId),
    retry: false,
  });
  const submit = useMutation({
    mutationFn: () =>
      createComment(resourceId, {
        body: body.trim(),
        parentCommentId: replyTo?.id ?? null,
      }),
    onSuccess: () => {
      setBody("");
      setReplyTo(undefined);
      queryClient.invalidateQueries({ queryKey: ["resource-comments", resourceId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-comments", resourceId] });
    },
  });

  return (
    <section className="mx-auto max-w-[var(--ed-content-reading)] border-t border-border py-14 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.03em]">{content.commentsTitle}</h2>
          <p className="mt-3 mb-0 max-w-2xl text-sm leading-6 text-ink-secondary">
            {content.commentsDescription}
          </p>
        </div>
        {comments.data ? (
          <p className="m-0 text-sm text-ink-tertiary">
            {comments.data.totalCount} {content.commentsTitle}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        {currentUser.data ? (
          <form
            className="rounded-md border border-border bg-surface p-4 sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (body.trim()) submit.mutate();
            }}
          >
            {replyTo ? (
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-ink-secondary">
                <span>
                  {content.replyingAction} @{replyTo.author.handle}
                </span>
                <button
                  className="border-0 bg-transparent text-ink-tertiary hover:text-ink"
                  onClick={() => setReplyTo(undefined)}
                  type="button"
                >
                  {content.cancelReply}
                </button>
              </div>
            ) : null}
            <label className="sr-only" htmlFor="comment-body">
              {content.commentPlaceholder}
            </label>
            <textarea
              className="min-h-28 w-full resize-y rounded-sm border border-border bg-surface px-3 py-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              id="comment-body"
              maxLength={2000}
              onChange={(event) => setBody(event.target.value)}
              placeholder={String(content.commentPlaceholder)}
              value={body}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-ink-tertiary">{body.length}/2000</span>
              <Button disabled={!body.trim() || submit.isPending} type="submit">
                {replyTo ? content.replyingAction : content.commentAction}
              </Button>
            </div>
            {submit.isError ? (
              <p className="mt-3 mb-0 text-sm text-danger" role="alert">
                {content.commentError}
              </p>
            ) : null}
          </form>
        ) : currentUser.isPending ? null : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-surface-subtle p-5">
            <p className="m-0 text-sm text-ink-secondary">{content.signInToInteract}</p>
            <Link
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              href={localizedRoute(locale, "/sign-in")}
            >
              {content.signInAction}
            </Link>
          </div>
        )}
      </div>

      {comments.isPending ? (
        <p className="py-12 text-center text-sm text-ink-secondary" aria-live="polite">
          {content.loadingComments}
        </p>
      ) : comments.isError ? (
        <p className="py-12 text-center text-sm text-danger" role="alert">
          {content.commentsUnavailable}
        </p>
      ) : comments.data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-tertiary">{content.emptyComments}</p>
      ) : (
        <div className="mt-9 space-y-8">
          {comments.data.items.map((thread) => (
            <article className="border-b border-border pb-8" key={thread.comment.id}>
              <CommentView
                comment={thread.comment}
                locale={locale}
                onDelete={(commentId) => remove.mutate(commentId)}
                onReply={() => {
                  setReplyTo(thread.comment);
                  document.getElementById("comment-body")?.focus();
                }}
                showReply={Boolean(currentUser.data)}
              />
              {thread.replies.length > 0 ? (
                <div className="mt-6 space-y-6 border-l-2 border-border pl-5 sm:pl-7">
                  {thread.replies.map((reply) => (
                    <CommentView
                      comment={reply}
                      key={reply.id}
                      locale={locale}
                      onDelete={(commentId) => remove.mutate(commentId)}
                      showReply={false}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentView({
  comment,
  locale,
  onDelete,
  onReply,
  showReply,
}: {
  comment: Comment;
  locale: string;
  onDelete: (commentId: string) => void;
  onReply?: () => void;
  showReply: boolean;
}) {
  const content = useIntlayer("interactions");
  const timestamp = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(comment.createdAt));
  const placeholder = comment.status === "DELETED" ? content.deletedComment : content.hiddenComment;
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold">{comment.author.displayName}</p>
          <p className="mt-1 mb-0 text-xs text-ink-tertiary">
            @{comment.author.handle} · <time dateTime={comment.createdAt}>{timestamp}</time>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {showReply && comment.status === "VISIBLE" ? (
            <button
              className="border-0 bg-transparent font-medium text-ink-tertiary hover:text-accent"
              onClick={onReply}
              type="button"
            >
              {content.replyingAction}
            </button>
          ) : null}
          {comment.canDelete ? (
            <button
              className="border-0 bg-transparent font-medium text-ink-tertiary hover:text-danger"
              onClick={() => onDelete(comment.id)}
              type="button"
            >
              {content.deleteComment}
            </button>
          ) : null}
        </div>
      </header>
      <p
        className={`mt-4 mb-0 whitespace-pre-wrap text-sm leading-7 ${
          comment.status === "VISIBLE" ? "text-ink-secondary" : "italic text-ink-tertiary"
        }`}
      >
        {comment.status === "VISIBLE" ? comment.body : placeholder}
      </p>
      {comment.replyCount > 0 ? (
        <p className="mt-3 mb-0 text-xs text-ink-tertiary">
          {comment.replyCount} {content.replyCount}
        </p>
      ) : null}
    </div>
  );
}

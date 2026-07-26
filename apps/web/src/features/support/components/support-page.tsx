"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, MessageCircleMore, Plus } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";

import { Button } from "@/components/primitives/button";
import { addMySupportTicketMessage, createSupportTicket } from "@/data-access/mutations/support";
import { getMySupportTicket, getMySupportTickets } from "@/data-access/queries/support";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type Category = components["schemas"]["SupportTicketCategory"];
type Status = components["schemas"]["SupportTicketStatus"];

export function SupportPage({ locale }: { locale: string }) {
  const content = useIntlayer("support");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>();
  const [showComposer, setShowComposer] = useState(false);
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const tickets = useQuery({
    queryKey: ["support", "mine"],
    queryFn: getMySupportTickets,
    enabled: Boolean(currentUser.data),
    retry: false,
  });
  const selectedId = selected ?? tickets.data?.items[0]?.id;
  const detail = useQuery({
    queryKey: ["support", "detail", selectedId],
    queryFn: () => getMySupportTicket(selectedId!),
    enabled: Boolean(selectedId),
    retry: false,
  });

  if (currentUser.isPending) return <PageState>{content.loadFailed}</PageState>;
  if (!currentUser.data) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-surface p-8 text-center">
        <LifeBuoy aria-hidden="true" className="mx-auto size-7 text-accent" />
        <h1 className="mt-5 mb-0 text-2xl font-semibold">{content.title}</h1>
        <p className="mt-3 mb-0 text-sm leading-6 text-ink-secondary">
          {content.authenticationRequired}
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signIn}
        </Link>
      </div>
    );
  }

  const refresh = async (ticketId?: string) => {
    if (ticketId) setSelected(ticketId);
    await queryClient.invalidateQueries({ queryKey: ["support"] });
  };

  return (
    <div>
      <div className="max-w-3xl">
        <p className="m-0 text-xs font-semibold tracking-[0.1em] text-accent uppercase">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 mb-0 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 mb-0 text-base leading-7 text-ink-secondary">{content.description}</p>
      </div>

      {showComposer ? (
        <TicketComposer
          onCancel={() => setShowComposer(false)}
          onCreated={async (ticketId) => {
            setShowComposer(false);
            await refresh(ticketId);
          }}
        />
      ) : (
        <Button className="mt-8" onClick={() => setShowComposer(true)} type="button">
          <Plus aria-hidden="true" className="size-4" />
          {content.newTicket}
        </Button>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <section className="overflow-hidden rounded-md border border-border bg-surface">
          <h2 className="m-0 border-b border-border px-5 py-4 text-sm font-semibold">
            {content.myTickets}
          </h2>
          {tickets.isPending ? <PageState>{content.loadFailed}</PageState> : null}
          {tickets.isError ? <PageState>{content.loadFailed}</PageState> : null}
          {tickets.data?.items.length === 0 ? <PageState>{content.empty}</PageState> : null}
          <ul className="m-0 list-none divide-y divide-border p-0">
            {tickets.data?.items.map((ticket) => (
              <li key={ticket.id}>
                <button
                  aria-current={ticket.id === selectedId ? "true" : undefined}
                  className={`w-full px-5 py-4 text-left transition-colors ${
                    ticket.id === selectedId ? "bg-accent-soft" : "hover:bg-surface-subtle"
                  }`}
                  onClick={() => setSelected(ticket.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">{ticket.subject}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-tertiary">
                    <StatusLabel status={ticket.status} />
                    <span>·</span>
                    <span>{categoryLabel(ticket.category, content)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {!selectedId ? (
          <PageState>{content.selectHint}</PageState>
        ) : detail.isPending ? (
          <PageState>{content.loadFailed}</PageState>
        ) : detail.data ? (
          <TicketConversation
            detail={detail.data}
            locale={locale}
            onUpdated={() => refresh(detail.data.ticket.id)}
          />
        ) : (
          <PageState>{content.loadFailed}</PageState>
        )}
      </div>
    </div>
  );
}

function TicketComposer({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (ticketId: string) => Promise<void>;
}) {
  const content = useIntlayer("support");
  const [category, setCategory] = useState<Category>("TECHNICAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createSupportTicket({ category, subject: subject.trim(), description: description.trim() }),
    onSuccess: (ticket) => onCreated(ticket.ticket.id),
  });
  const valid = subject.trim().length >= 5 && description.trim().length >= 20;
  return (
    <form
      className="mt-8 rounded-md border border-border bg-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) mutation.mutate();
      }}
    >
      <h2 className="m-0 text-lg font-semibold">{content.newTicket}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          {content.category}
          <select
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-normal"
            onChange={(event) => setCategory(event.target.value as Category)}
            value={category}
          >
            {(["ACCOUNT", "CONTENT", "COPYRIGHT", "EVIDENCE", "TECHNICAL", "OTHER"] as const).map(
              (item) => (
                <option key={item} value={item}>
                  {categoryLabel(item, content)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {content.subject}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-normal"
            maxLength={160}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={String(content.subjectPlaceholder)}
            value={subject}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          {content.descriptionLabel}
          <textarea
            className="mt-2 min-h-32 w-full rounded-sm border border-border bg-canvas p-3 font-normal"
            maxLength={5000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={String(content.descriptionPlaceholder)}
            value={description}
          />
        </label>
      </div>
      {mutation.isError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {content.createFailed}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="quiet">
          {content.cancel}
        </Button>
        <Button disabled={!valid || mutation.isPending} type="submit">
          {mutation.isPending ? content.creating : content.create}
        </Button>
      </div>
    </form>
  );
}

function TicketConversation({
  detail,
  locale,
  onUpdated,
}: {
  detail: components["schemas"]["SupportTicketDetail"];
  locale: string;
  onUpdated: () => Promise<void>;
}) {
  const content = useIntlayer("support");
  const [reply, setReply] = useState("");
  const mutation = useMutation({
    mutationFn: () => addMySupportTicketMessage(detail.ticket.id, reply.trim()),
    onSuccess: async () => {
      setReply("");
      await onUpdated();
    },
  });
  const closed = detail.ticket.status === "CLOSED";
  return (
    <article className="rounded-md border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge>
              <StatusLabel status={detail.ticket.status} />
            </StatusBadge>
            {detail.ticket.priority === "HIGH" ? (
              <StatusBadge>{content.priorityHigh}</StatusBadge>
            ) : null}
          </div>
          <h2 className="mt-4 mb-0 text-2xl font-semibold tracking-[-0.025em]">
            {detail.ticket.subject}
          </h2>
          <p className="mt-2 mb-0 text-xs text-ink-tertiary">
            {categoryLabel(detail.ticket.category, content)} ·{" "}
            {formatDate(detail.ticket.updatedAt, locale)}
          </p>
        </div>
      </div>
      <section className="mt-7 rounded-sm bg-surface-subtle p-5">
        <h3 className="m-0 text-sm font-semibold">{content.originalRequest}</h3>
        <p className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
          {detail.description}
        </p>
      </section>
      <section className="mt-7">
        <h3 className="m-0 flex items-center gap-2 text-sm font-semibold">
          <MessageCircleMore aria-hidden="true" className="size-4 text-accent" />
          {content.conversation}
        </h3>
        {detail.messages.length === 0 ? (
          <p className="mt-4 text-sm text-ink-tertiary">{content.noMessages}</p>
        ) : null}
        <ol className="mt-4 list-none space-y-3 p-0">
          {detail.messages.map((message) => (
            <li
              className={`rounded-sm p-4 ${message.staffReply ? "bg-accent-soft" : "bg-surface-subtle"}`}
              key={message.id}
            >
              <div className="flex items-center justify-between gap-4 text-xs">
                <strong>{message.staffReply ? content.staff : content.you}</strong>
                <span className="text-ink-tertiary">{formatDate(message.createdAt, locale)}</span>
              </div>
              <p className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
                {message.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
      {closed ? (
        <p className="mt-6 rounded-sm bg-surface-subtle p-4 text-sm text-ink-secondary">
          {content.closedHint}
        </p>
      ) : (
        <form
          className="mt-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (reply.trim().length >= 2) mutation.mutate();
          }}
        >
          <label className="text-sm font-semibold">
            {content.reply}
            <textarea
              className="mt-2 min-h-24 w-full rounded-sm border border-border bg-canvas p-3 font-normal"
              maxLength={5000}
              onChange={(event) => setReply(event.target.value)}
              placeholder={String(content.replyPlaceholder)}
              value={reply}
            />
          </label>
          <Button
            className="mt-3"
            disabled={reply.trim().length < 2 || mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? content.sending : content.send}
          </Button>
        </form>
      )}
    </article>
  );
}

function StatusLabel({ status }: { status: Status }) {
  const content = useIntlayer("support");
  const labels = {
    OPEN: content.statusOpen,
    IN_PROGRESS: content.statusInProgress,
    WAITING_FOR_USER: content.statusWaitingForUser,
    RESOLVED: content.statusResolved,
    CLOSED: content.statusClosed,
  };
  return labels[status];
}

function categoryLabel(category: Category, content: ReturnType<typeof useIntlayer<"support">>) {
  return {
    ACCOUNT: content.categoryAccount,
    CONTENT: content.categoryContent,
    COPYRIGHT: content.categoryCopyright,
    EVIDENCE: content.categoryEvidence,
    TECHNICAL: content.categoryTechnical,
    OTHER: content.categoryOther,
  }[category];
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-secondary">
      {children}
    </span>
  );
}

function PageState({ children }: { children: React.ReactNode }) {
  return <p className="m-0 p-6 text-sm text-ink-tertiary">{children}</p>;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

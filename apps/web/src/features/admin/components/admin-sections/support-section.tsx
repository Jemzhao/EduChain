"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Button } from "@/components/primitives/button";
import {
  addAdminSupportTicketMessage,
  governAdminSupportTicket,
} from "@/data-access/mutations/support";
import { getAdminSupportTicket, getAdminSupportTickets } from "@/data-access/queries/support";
import { DateValue, Loading, LoadError, SectionHeader, StatusBadge, statusText } from "../admin-ui";

export function SupportSection() {
  const content = useIntlayer("admin");
  const [selected, setSelected] = useState<string>();
  const queue = useQuery({
    queryKey: ["admin", "support"],
    queryFn: () => getAdminSupportTickets(),
    retry: false,
  });
  const selectedId = selected ?? queue.data?.items[0]?.id;
  const detail = useQuery({
    queryKey: ["admin", "support", selectedId],
    queryFn: () => getAdminSupportTicket(selectedId!),
    enabled: Boolean(selectedId),
    retry: false,
  });
  if (queue.isPending) return <Loading />;
  if (!queue.data) return <LoadError />;
  return (
    <div>
      <SectionHeader title={content.supportTitle} description={content.supportDescription} />
      <div className="mt-8 grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start">
        <section className="overflow-hidden rounded-md border border-border bg-surface">
          {queue.data.items.length === 0 ? (
            <p className="m-0 p-5 text-sm text-ink-tertiary">{content.empty}</p>
          ) : (
            <ul className="m-0 list-none divide-y divide-border p-0">
              {queue.data.items.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    aria-current={ticket.id === selectedId ? "true" : undefined}
                    className={`w-full p-4 text-left ${
                      ticket.id === selectedId ? "bg-accent-soft" : "hover:bg-surface-subtle"
                    }`}
                    onClick={() => setSelected(ticket.id)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{ticket.subject}</span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-ink-tertiary">
                      <span>{statusText(ticket.status, content)}</span>
                      {ticket.priority === "HIGH" ? <span>· {content.supportHigh}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {!selectedId ? (
          <p className="m-0 rounded-md border border-border p-8 text-sm text-ink-tertiary">
            {content.supportSelect}
          </p>
        ) : detail.isPending ? (
          <Loading />
        ) : detail.data ? (
          <SupportTicketEditor
            detail={detail.data}
            key={`${detail.data.ticket.id}:${detail.data.ticket.version}`}
          />
        ) : (
          <LoadError />
        )}
      </div>
    </div>
  );
}

function SupportTicketEditor({ detail }: { detail: components["schemas"]["SupportTicketDetail"] }) {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(detail.ticket.status);
  const [priority, setPriority] = useState(detail.ticket.priority);
  const [reason, setReason] = useState("");
  const [reply, setReply] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
  const governance = useMutation({
    mutationFn: () =>
      governAdminSupportTicket(detail.ticket.id, detail.ticket.version, {
        status,
        priority,
        reason: reason.trim(),
      }),
    onSuccess: refresh,
  });
  const response = useMutation({
    mutationFn: () => addAdminSupportTicketMessage(detail.ticket.id, reply.trim()),
    onSuccess: async () => {
      setReply("");
      await refresh();
    },
  });
  return (
    <article className="rounded-md border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusBadge>{statusText(detail.ticket.status, content)}</StatusBadge>
          <h2 className="mt-4 mb-0 text-xl font-semibold">{detail.ticket.subject}</h2>
          <p className="mt-2 mb-0 font-mono text-xs text-ink-tertiary">{detail.ticket.id}</p>
        </div>
        <StatusBadge>
          {detail.ticket.priority === "HIGH" ? content.supportHigh : content.supportNormal}
        </StatusBadge>
      </div>
      <section className="mt-6 rounded-sm bg-surface-subtle p-5">
        <h3 className="m-0 text-sm font-semibold">{content.supportOriginal}</h3>
        <p className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
          {detail.description}
        </p>
      </section>
      <section className="mt-7">
        <h3 className="m-0 text-sm font-semibold">{content.supportConversation}</h3>
        <ol className="mt-4 list-none space-y-3 p-0">
          {detail.messages.map((message) => (
            <li className="rounded-sm border border-border p-4" key={message.id}>
              <div className="flex items-center justify-between gap-4 text-xs">
                <strong>
                  {message.staffReply ? content.supportStaff : content.supportRequester}
                </strong>
                <span className="text-ink-tertiary">
                  <DateValue value={message.createdAt} />
                </span>
              </div>
              <p className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
                {message.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <form
        className="mt-7 grid gap-4 rounded-sm border border-border p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (reason.trim().length >= 10) governance.mutate();
        }}
      >
        <label className="text-xs font-semibold">
          {content.supportWorkflow}
          <select
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm font-normal"
            onChange={(event) => setStatus(event.target.value as typeof status)}
            value={status}
          >
            {(["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"] as const).map(
              (item) => (
                <option key={item} value={item}>
                  {statusText(item, content)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-xs font-semibold">
          {content.supportPriority}
          <select
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm font-normal"
            onChange={(event) => setPriority(event.target.value as typeof priority)}
            value={priority}
          >
            <option value="NORMAL">{content.supportNormal}</option>
            <option value="HIGH">{content.supportHigh}</option>
          </select>
        </label>
        <label className="text-xs font-semibold sm:col-span-2">
          {content.supportReason}
          <textarea
            className="mt-2 min-h-20 w-full rounded-sm border border-border bg-canvas p-3 text-sm font-normal"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
        </label>
        <div className="sm:col-span-2">
          <Button disabled={reason.trim().length < 10 || governance.isPending} type="submit">
            {content.supportApply}
          </Button>
        </div>
      </form>
      {detail.ticket.status !== "CLOSED" ? (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (reply.trim().length >= 2) response.mutate();
          }}
        >
          <label className="text-sm font-semibold">
            {content.supportReply}
            <textarea
              className="mt-2 min-h-24 w-full rounded-sm border border-border bg-canvas p-3 font-normal"
              maxLength={5000}
              onChange={(event) => setReply(event.target.value)}
              placeholder={String(content.supportReplyPlaceholder)}
              value={reply}
            />
          </label>
          <Button
            className="mt-3"
            disabled={reply.trim().length < 2 || response.isPending}
            type="submit"
          >
            {content.supportSend}
          </Button>
        </form>
      ) : null}
      {governance.isError || response.isError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {content.actionFailed}
        </p>
      ) : null}
    </article>
  );
}

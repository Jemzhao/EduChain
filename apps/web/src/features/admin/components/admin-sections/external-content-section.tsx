"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Button } from "@/components/primitives/button";
import {
  createAdminExternalSource,
  reviewAdminExternalItem,
  syncAdminExternalSource,
  updateAdminExternalSource,
} from "@/data-access/mutations/external-content";
import {
  getAdminExternalItems,
  getAdminExternalSources,
} from "@/data-access/queries/external-content";
import {
  GovernanceAction,
  ItemList,
  Loading,
  LoadError,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

export function ExternalContentSection({ administrator }: { administrator: boolean }) {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<
    components["schemas"]["ExternalContentSource"] | null | undefined
  >(undefined);
  const sources = useQuery({
    queryKey: ["admin", "external-content", "sources"],
    queryFn: getAdminExternalSources,
    enabled: administrator,
    retry: false,
  });
  const items = useQuery({
    queryKey: ["admin", "external-content", "items"],
    queryFn: () => getAdminExternalItems(),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "external-content"] });
  if (items.isPending || (administrator && sources.isPending)) return <Loading />;
  if (!items.data || (administrator && !sources.data)) return <LoadError />;
  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader title={content.externalTitle} description={content.externalDescription} />
          {administrator ? (
            <Button onClick={() => setEditor(null)} type="button">
              {content.externalNewSource}
            </Button>
          ) : null}
        </div>
        {editor !== undefined ? (
          <ExternalSourceEditor
            onCancel={() => setEditor(undefined)}
            onSaved={async () => {
              setEditor(undefined);
              await refresh();
            }}
            source={editor}
          />
        ) : null}
      </section>
      {administrator ? (
        <section>
          <h2 className="m-0 text-xl font-semibold">{content.externalSources}</h2>
          <div className="mt-5 space-y-4">
            {sources.data!.items.map((source) => (
              <article className="rounded-md border border-border bg-surface p-5" key={source.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 text-base font-semibold">{source.name}</h3>
                      <StatusBadge>{statusText(source.syncStatus, content)}</StatusBadge>
                    </div>
                    <p className="mt-2 mb-0 break-all text-xs text-ink-tertiary">
                      {source.feedUrl}
                    </p>
                    {source.lastSyncError ? (
                      <p className="mt-2 mb-0 font-mono text-xs text-danger">
                        {source.lastSyncError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setEditor(source)} type="button" variant="quiet">
                      {content.externalEditSource}
                    </Button>
                    <GovernanceAction
                      actionLabel={content.externalSync}
                      onConfirm={async (reason) => {
                        await syncAdminExternalSource(source.id, reason);
                        await refresh();
                      }}
                      target={source.name}
                      variant="secondary"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="m-0 text-xl font-semibold">{content.externalReview}</h2>
        <ItemList empty={items.data.items.length === 0}>
          {items.data.items.map((item) => (
            <li className="p-5" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{statusText(item.qualityStatus, content)}</StatusBadge>
                    <span className="text-xs text-ink-tertiary">{item.sourceName}</span>
                  </div>
                  <h3 className="mt-4 mb-0 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 mb-0 text-sm leading-6 text-ink-secondary">{item.summary}</p>
                  <a
                    className="mt-3 inline-block break-all text-xs text-accent"
                    href={item.canonicalUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.canonicalUrl}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.qualityStatus !== "APPROVED" ? (
                    <GovernanceAction
                      actionLabel={content.externalApprove}
                      onConfirm={async (reason) => {
                        await reviewAdminExternalItem(item.id, item.version, "APPROVED", reason);
                        await refresh();
                      }}
                      target={item.title}
                      variant="secondary"
                    />
                  ) : null}
                  {item.qualityStatus !== "REJECTED" ? (
                    <GovernanceAction
                      actionLabel={content.externalReject}
                      onConfirm={async (reason) => {
                        await reviewAdminExternalItem(item.id, item.version, "REJECTED", reason);
                        await refresh();
                      }}
                      target={item.title}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ItemList>
      </section>
    </div>
  );
}

function ExternalSourceEditor({
  source,
  onCancel,
  onSaved,
}: {
  source: components["schemas"]["ExternalContentSource"] | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const content = useIntlayer("admin");
  const [name, setName] = useState(source?.name ?? "");
  const [siteUrl, setSiteUrl] = useState(source?.siteUrl ?? "https://");
  const [feedUrl, setFeedUrl] = useState(source?.feedUrl ?? "https://");
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        siteUrl: siteUrl.trim(),
        feedUrl: feedUrl.trim(),
        enabled,
        reason: reason.trim(),
      };
      return source
        ? updateAdminExternalSource(source.id, source.version, body)
        : createAdminExternalSource(body);
    },
    onSuccess: onSaved,
  });
  const valid =
    name.trim().length > 0 &&
    siteUrl.startsWith("https://") &&
    feedUrl.startsWith("https://") &&
    reason.trim().length >= 10;
  return (
    <form
      className="mt-6 rounded-md border border-border bg-surface-subtle p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) mutation.mutate();
      }}
    >
      <h2 className="m-0 text-lg font-semibold">
        {source ? content.externalEditSource : content.externalNewSource}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          {content.externalName}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-normal"
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
          <input
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          {content.externalEnabled}
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          {content.externalSiteUrl}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-normal"
            maxLength={2048}
            onChange={(event) => setSiteUrl(event.target.value)}
            type="url"
            value={siteUrl}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          {content.externalFeedUrl}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-normal"
            maxLength={2048}
            onChange={(event) => setFeedUrl(event.target.value)}
            type="url"
            value={feedUrl}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          {content.actionReasonLabel}
          <textarea
            className="mt-2 min-h-20 w-full rounded-sm border border-border bg-canvas p-3 font-normal"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
        </label>
      </div>
      {mutation.isError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {content.actionFailed}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="quiet">
          {content.cancel}
        </Button>
        <Button disabled={!valid || mutation.isPending} type="submit">
          {content.saveAction}
        </Button>
      </div>
    </form>
  );
}

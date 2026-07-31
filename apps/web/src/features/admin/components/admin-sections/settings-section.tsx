"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useId, useState } from "react";
import { Button } from "@/components/primitives/button";
import { updateAdminPlatformSetting } from "@/data-access/mutations/admin";
import { getAdminPlatformSettings } from "@/data-access/queries/admin";
import { Loading, LoadError, SectionHeader, StatusBadge, statusText } from "../admin-ui";

export function SettingsSection() {
  const content = useIntlayer("admin");
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminPlatformSettings,
    retry: false,
  });
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  return (
    <div>
      <SectionHeader title={content.settingsTitle} description={content.settingsDescription} />
      <div className="mt-8 space-y-4">
        {query.data.items.map((setting) => (
          <SettingEditor key={`${setting.key}:${setting.version}`} setting={setting} />
        ))}
      </div>
    </div>
  );
}

function SettingEditor({ setting }: { setting: components["schemas"]["PlatformSettingResponse"] }) {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const inputId = useId();
  const reasonId = useId();
  const [value, setValue] = useState(setting.value);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      updateAdminPlatformSetting(setting.key, setting.version, value, reason.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setReason("");
    },
  });
  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 font-mono text-sm font-semibold">{setting.key}</h2>
          <p className="mt-2 mb-0 text-xs text-ink-tertiary">
            {setting.publicVisible ? content.settingPublic : content.settingPrivate} ·{" "}
            {statusText(setting.type, content)}
          </p>
        </div>
        <StatusBadge>v{setting.version}</StatusBadge>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="text-xs font-semibold" htmlFor={inputId}>
          {content.settingValue}
          {setting.type === "BOOLEAN" ? (
            <select
              className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
              id={inputId}
              onChange={(event) => setValue(event.target.value)}
              value={value}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
              id={inputId}
              onChange={(event) => setValue(event.target.value)}
              value={value}
            />
          )}
        </label>
        <label className="text-xs font-semibold" htmlFor={reasonId}>
          {content.actionReasonLabel}
          <input
            className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm"
            id={reasonId}
            onChange={(event) => setReason(event.target.value)}
            placeholder={String(content.actionReasonHint)}
            value={reason}
          />
        </label>
        <Button
          disabled={mutation.isPending || reason.trim().length < 10 || value === setting.value}
          onClick={() => mutation.mutate()}
          type="button"
        >
          {mutation.isPending ? content.working : content.saveAction}
        </Button>
      </div>
      {mutation.isError ? (
        <p className="mt-3 mb-0 text-xs text-danger" role="alert">
          {content.actionFailed}
        </p>
      ) : null}
    </section>
  );
}

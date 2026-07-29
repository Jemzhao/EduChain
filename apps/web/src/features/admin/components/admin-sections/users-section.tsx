"use client";

import type { components } from "@educhain/api-contract";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Button } from "@/components/primitives/button";
import {
  createAdminUser,
  deleteAdminUser,
  deleteAdminUsers,
  exportAdminUsers,
  requestAdminPasswordReset,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/data-access/mutations/admin";
import { getAdminUsers } from "@/data-access/queries/admin";
import {
  DateValue,
  downloadCsv,
  EditorField,
  GovernanceAction,
  Loading,
  LoadError,
  ResponsiveTable,
  SectionHeader,
  StatusBadge,
  statusText,
} from "../admin-ui";

type UserStatus = components["schemas"]["UserStatus"];

export function UsersSection({ currentUserId }: { currentUserId: string }) {
  const content = useIntlayer("admin");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<
    components["schemas"]["AdminUserResponse"] | "new" | undefined
  >();
  const [previewToken, setPreviewToken] = useState<string>();
  const query = useQuery({
    queryKey: ["admin", "users", search, status],
    queryFn: () => getAdminUsers({ query: search || undefined, status: status || undefined }),
    retry: false,
  });
  const refresh = async () => {
    setSelected([]);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };
  if (query.isPending) return <Loading />;
  if (!query.data) return <LoadError />;
  return (
    <div>
      <SectionHeader title={content.userListTitle} description={content.userListDescription} />
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-4">
        <label className="min-w-56 flex-1 text-xs font-semibold text-ink-tertiary">
          {content.searchUsers}
          <input
            className="mt-2 min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm text-ink"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={String(content.searchUsersPlaceholder)}
            value={search}
          />
        </label>
        <label className="text-xs font-semibold text-ink-tertiary">
          {content.statusLabel}
          <select
            className="mt-2 block min-h-11 rounded-sm border border-border bg-canvas px-3 text-sm text-ink"
            onChange={(event) => setStatus(event.target.value as UserStatus | "")}
            value={status}
          >
            <option value="">{content.allStatuses}</option>
            <option value="ACTIVE">{content.active}</option>
            <option value="RESTRICTED">{content.restricted}</option>
            <option value="DISABLED">{content.disabled}</option>
          </select>
        </label>
        <Button onClick={() => setEditor("new")} type="button">
          {content.createUser}
        </Button>
        <GovernanceAction
          actionLabel={content.exportUsers}
          onConfirm={async (reason) =>
            downloadCsv(await exportAdminUsers(reason), "educhain-users.csv")
          }
          target={String(content.userListTitle)}
          variant="secondary"
        />
        {selected.length ? (
          <GovernanceAction
            actionLabel={`${String(content.disableSelected)} (${selected.length})`}
            onConfirm={async (reason) => {
              await deleteAdminUsers(selected, reason);
              await refresh();
            }}
            target={`${selected.length} ${String(content.users)}`}
            variant="danger"
          />
        ) : null}
      </div>
      {editor ? (
        <UserEditor
          item={editor === "new" ? undefined : editor}
          onCancel={() => setEditor(undefined)}
          onSaved={async (token) => {
            setEditor(undefined);
            setPreviewToken(token ?? undefined);
            await refresh();
          }}
        />
      ) : null}
      {previewToken ? (
        <div className="mt-5 rounded-md border border-accent/30 bg-accent-soft p-4">
          <p className="m-0 text-sm font-semibold text-ink">{content.passwordSetupReady}</p>
          <p className="mt-2 mb-0 break-all font-mono text-xs text-ink-secondary">{previewToken}</p>
          <p className="mt-2 mb-0 text-xs text-ink-tertiary">{content.previewTokenNotice}</p>
        </div>
      ) : null}
      <ResponsiveTable
        columns={[
          "",
          content.userLabel,
          content.roleLabel,
          content.statusLabel,
          content.createdLabel,
          "",
        ]}
      >
        {query.data.items.map((item) => {
          const own = item.user.id === currentUserId;
          return (
            <tr className="border-t border-border align-top" key={item.user.id}>
              <td className="px-4 py-4">
                {!own ? (
                  <input
                    aria-label={`${String(content.selectUser)} ${item.user.displayName}`}
                    checked={selected.includes(item.user.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, item.user.id]
                          : current.filter((id) => id !== item.user.id),
                      )
                    }
                    type="checkbox"
                  />
                ) : null}
              </td>
              <td className="px-4 py-4">
                <p className="m-0 font-semibold">{item.user.displayName}</p>
                <p className="mt-1 mb-0 text-xs text-ink-tertiary">@{item.user.handle}</p>
                <p className="mt-1 mb-0 text-xs text-ink-tertiary">{item.email}</p>
              </td>
              <td className="px-4 py-4 text-sm text-ink-secondary">
                {item.roles.map((role, index) => (
                  <span key={role}>
                    {index ? " · " : null}
                    {statusText(role, content)}
                  </span>
                ))}
              </td>
              <td className="px-4 py-4">
                <StatusBadge>{statusText(item.user.status, content)}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-sm text-ink-tertiary">
                <DateValue value={item.createdAt} />
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={() => setEditor(item)} type="button" variant="quiet">
                    {content.editItem}
                  </Button>
                  <GovernanceAction
                    actionLabel={content.resetPassword}
                    onConfirm={async (reason) => {
                      const result = await requestAdminPasswordReset(item.user.id, reason);
                      setPreviewToken(result.previewToken ?? undefined);
                    }}
                    target={item.user.displayName}
                    variant="secondary"
                  />
                  {!own ? (
                    <GovernanceAction
                      actionLabel={
                        item.user.status === "ACTIVE" ? content.restrictUser : content.restoreUser
                      }
                      onConfirm={async (reason) => {
                        const next: UserStatus =
                          item.user.status === "ACTIVE" ? "RESTRICTED" : "ACTIVE";
                        await updateAdminUserStatus(item.user.id, item.user.version, next, reason);
                        await refresh();
                      }}
                      target={item.user.displayName}
                    />
                  ) : null}
                  {!own && item.user.status !== "DISABLED" ? (
                    <GovernanceAction
                      actionLabel={content.disableUser}
                      onConfirm={async (reason) => {
                        await deleteAdminUser(item.user.id, item.user.version, reason);
                        await refresh();
                      }}
                      target={item.user.displayName}
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

function UserEditor({
  item,
  onCancel,
  onSaved,
}: {
  item?: components["schemas"]["AdminUserResponse"];
  onCancel: () => void;
  onSaved: (previewToken?: string | null) => Promise<void>;
}) {
  const content = useIntlayer("admin");
  const [email, setEmail] = useState(item?.email ?? "");
  const [handle, setHandle] = useState(item?.user.handle ?? "");
  const [displayName, setDisplayName] = useState(item?.user.displayName ?? "");
  const [status, setStatus] = useState<UserStatus>(item?.user.status ?? "ACTIVE");
  const [roles, setRoles] = useState<Array<"USER" | "MODERATOR" | "ADMINISTRATOR">>(
    item?.roles ?? ["USER"],
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggleRole = (role: "USER" | "MODERATOR" | "ADMINISTRATOR") => {
    if (role === "USER") return;
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  return (
    <form
      className="mt-5 rounded-md border border-border bg-surface p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setFailed(false);
        try {
          const common = {
            email: email.trim(),
            handle: handle.trim().toLowerCase(),
            displayName: displayName.trim(),
            roles,
            reason: reason.trim(),
          };
          if (item) {
            await updateAdminUser(item.user.id, item.user.version, { ...common, status });
            await onSaved();
          } else {
            const result = await createAdminUser(common);
            await onSaved(result.passwordSetup.previewToken);
          }
        } catch {
          setFailed(true);
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2 className="m-0 text-lg font-semibold">{item ? content.editUser : content.createUser}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <EditorField label={content.emailLabel} onChange={setEmail} type="email" value={email} />
        <EditorField label={content.handleLabel} onChange={setHandle} value={handle} />
        <EditorField label={content.nameLabel} onChange={setDisplayName} value={displayName} />
        {item ? (
          <label className="text-xs font-semibold text-ink-tertiary">
            {content.statusLabel}
            <select
              className="mt-2 block min-h-11 w-full rounded-sm border border-border bg-canvas px-3 text-sm text-ink"
              onChange={(event) => setStatus(event.target.value as UserStatus)}
              value={status}
            >
              <option value="ACTIVE">{content.active}</option>
              <option value="RESTRICTED">{content.restricted}</option>
              <option value="DISABLED">{content.disabled}</option>
            </select>
          </label>
        ) : null}
      </div>
      <fieldset className="mt-5 border-0 p-0">
        <legend className="text-xs font-semibold text-ink-tertiary">{content.roleLabel}</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-secondary">
          {(["USER", "MODERATOR", "ADMINISTRATOR"] as const).map((role) => (
            <label className="inline-flex items-center gap-2" key={role}>
              <input
                checked={roles.includes(role)}
                disabled={role === "USER"}
                onChange={() => toggleRole(role)}
                type="checkbox"
              />
              {statusText(role, content)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 block text-xs font-semibold text-ink-tertiary">
        {content.actionReasonLabel}
        <textarea
          className="mt-2 min-h-24 w-full rounded-sm border border-border bg-canvas p-3 text-sm text-ink"
          maxLength={500}
          minLength={10}
          onChange={(event) => setReason(event.target.value)}
          required
          value={reason}
        />
      </label>
      {failed ? <p className="mt-3 text-sm text-danger">{content.actionFailed}</p> : null}
      <div className="mt-5 flex gap-3">
        <Button disabled={saving} type="submit">
          {saving ? content.savingAction : content.saveAction}
        </Button>
        <Button onClick={onCancel} type="button" variant="secondary">
          {content.cancel}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { ApiError } from "@/data-access/http/api-error";
import { changePassword, deleteSession, getSessions } from "@/data-access/mutations/auth";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
});

export function SecuritySettings({ locale }: { locale: string }) {
  const content = useIntlayer("profile-page");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string>();
  const profileQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const sessionsQuery = useQuery({
    queryKey: ["auth-sessions"],
    queryFn: getSessions,
    retry: false,
    enabled: profileQuery.isSuccess,
  });
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<PasswordValues>({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const revoke = useMutation({
    mutationFn: deleteSession,
    onMutate: (sessionId) => setRevokingId(sessionId),
    onSuccess: async (_, sessionId) => {
      const current = sessionsQuery.data?.items.find(
        (session) => session.id === sessionId,
      )?.current;
      if (current) {
        queryClient.removeQueries({ queryKey: ["current-user"] });
        router.push(localizedRoute(locale, "/sign-in"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
    onSettled: () => setRevokingId(undefined),
  });

  const submit = handleSubmit(async (values) => {
    clearErrors();
    const result = passwordSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PasswordValues;
        setError(field, {
          type: "validate",
          message: String(
            field === "currentPassword" ? content.passwordInvalid : content.passwordChangeError,
          ),
        });
      }
      return;
    }
    if (result.data.newPassword !== result.data.confirmPassword) {
      setError("confirmPassword", {
        type: "validate",
        message: String(content.passwordMismatch),
      });
      return;
    }

    try {
      await changePassword({
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
      });
      queryClient.clear();
      router.push(localizedRoute(locale, "/sign-in"));
    } catch (error) {
      const code = error instanceof ApiError ? error.problem.code : undefined;
      setError("root", {
        type: "server",
        message: String(
          code === "ACCOUNT_CREDENTIALS_INVALID"
            ? content.passwordInvalid
            : code === "PASSWORD_REUSE_NOT_ALLOWED"
              ? content.passwordReuse
              : content.passwordChangeError,
        ),
      });
    }
  });

  if (profileQuery.isPending) {
    return <p className="py-20 text-center text-ink-secondary">{content.loading}</p>;
  }
  if (profileQuery.error instanceof ApiError) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em]">
          {content.authenticationRequiredTitle}
        </h1>
        <p className="mt-4 text-ink-secondary">{content.authenticationRequiredDescription}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signInAction}
        </Link>
      </div>
    );
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <aside>
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.securityEyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-semibold tracking-[-0.035em]">
          {content.securityTitle}
        </h1>
        <p className="mt-4 leading-7 text-ink-secondary">{content.securityDescription}</p>
        <nav aria-label={String(content.securityEyebrow)} className="mt-8 space-y-2">
          <Link
            className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink"
            href={localizedRoute(locale, "/settings/profile")}
          >
            <UserRound aria-hidden="true" className="size-4" />
            {content.profileLink}
          </Link>
          <Link
            aria-current="page"
            className="flex min-h-11 items-center gap-3 rounded-sm bg-accent-soft px-3 text-sm font-semibold text-accent no-underline"
            href={localizedRoute(locale, "/settings/security")}
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {content.securityLink}
          </Link>
        </nav>
      </aside>

      <div className="space-y-6">
        <form
          className="rounded-md border border-border bg-surface p-6 sm:p-8"
          noValidate
          onSubmit={submit}
        >
          <h2 className="m-0 text-xl font-semibold tracking-[-0.02em]">{content.passwordTitle}</h2>
          <div className="mt-6 space-y-5">
            <FormField
              error={errors.currentPassword?.message}
              id="current-password"
              inputProps={{
                ...register("currentPassword"),
                autoComplete: "current-password",
                maxLength: 128,
                type: "password",
              }}
              label={String(content.currentPasswordLabel)}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                error={errors.newPassword?.message}
                id="new-password"
                inputProps={{
                  ...register("newPassword"),
                  autoComplete: "new-password",
                  maxLength: 128,
                  type: "password",
                }}
                label={String(content.newPasswordLabel)}
              />
              <FormField
                error={errors.confirmPassword?.message}
                id="confirm-password"
                inputProps={{
                  ...register("confirmPassword"),
                  autoComplete: "new-password",
                  maxLength: 128,
                  type: "password",
                }}
                label={String(content.confirmPasswordLabel)}
              />
            </div>
          </div>
          {errors.root?.message ? (
            <p
              className="mt-5 rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end border-t border-border pt-6">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? content.changingPassword : content.changePasswordAction}
            </Button>
          </div>
        </form>

        <section className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <h2 className="m-0 text-xl font-semibold tracking-[-0.02em]">{content.sessionsTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">{content.sessionsDescription}</p>
          {sessionsQuery.isError ? (
            <p
              className="mt-5 rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {content.sessionsError}
            </p>
          ) : null}
          <ul className="mt-6 list-none divide-y divide-border p-0">
            {sessionsQuery.data?.items.map((session) => (
              <li
                className="flex flex-wrap items-center justify-between gap-4 py-5"
                key={session.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--ed-radius-pill)] bg-surface-subtle text-ink-secondary">
                    <MonitorSmartphone aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="m-0 text-sm font-semibold">
                      {session.deviceLabel ?? content.sessionsTitle}
                      {session.current ? (
                        <span className="ml-2 rounded-[var(--ed-radius-pill)] bg-success-soft px-2 py-1 text-xs text-success">
                          {content.currentSession}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 mb-0 text-xs leading-5 text-ink-tertiary">
                      {content.sessionCreated} {formatDate(session.createdAt)} ·{" "}
                      {content.sessionExpires} {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>
                <Button
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(session.id)}
                  type="button"
                  variant="quiet"
                >
                  {revokingId === session.id ? content.revokingSession : content.revokeSession}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

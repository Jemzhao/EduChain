"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { createSession } from "@/data-access/mutations/auth";
import { publicEnvironment } from "@/lib/env/public";
import { localizedRoute } from "@/lib/routing/localized-route";

import { AuthErrorMessage } from "./auth-error-message";

type SignInValues = {
  identifier: string;
  password: string;
};

const schema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

export function SignInForm({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<unknown>();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<SignInValues>({ defaultValues: { identifier: "", password: "" } });

  const openAuthenticatedPage = async (values: SignInValues, destination: string) => {
    await createSession(values);
    await queryClient.invalidateQueries({ queryKey: ["current-user"] });
    router.push(localizedRoute(locale, destination));
  };

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setSubmissionError(undefined);
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignInValues;
        setError(field, {
          type: "validate",
          message: String(
            field === "identifier" ? content.validationIdentifier : content.validationPassword,
          ),
        });
      }
      return;
    }

    try {
      await openAuthenticatedPage(result.data, "/settings/profile");
    } catch (error) {
      setSubmissionError(error);
    }
  });

  const signInAsDemoAdministrator = async () => {
    const credentials = {
      identifier: "demo@educhain.local",
      password: "Trustworthy!Demo",
    } satisfies SignInValues;

    setValue("identifier", credentials.identifier, { shouldDirty: true, shouldTouch: true });
    setValue("password", credentials.password, { shouldDirty: true, shouldTouch: true });
    clearErrors();
    setSubmissionError(undefined);
    setIsDemoSubmitting(true);
    try {
      await openAuthenticatedPage(credentials, "/admin");
    } catch (error) {
      setSubmissionError(error);
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      {publicEnvironment.apiMode === "mock" ? (
        <aside className="rounded-sm border border-accent/20 bg-accent-soft px-4 py-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-[0_1px_2px_oklch(0.2_0.01_250/0.08)]">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="m-0 font-semibold text-ink">{content.demoTitle}</p>
              <p className="mt-1 mb-0 leading-6 text-ink-secondary">{content.demoHint}</p>
            </div>
          </div>
          <Button
            className="mt-4 w-full bg-surface"
            disabled={isSubmitting || isDemoSubmitting}
            onClick={() => void signInAsDemoAdministrator()}
            type="button"
            variant="secondary"
          >
            {isDemoSubmitting ? content.demoAdminPending : content.demoAdminAction}
          </Button>
          <p className="mt-3 mb-0 text-xs leading-5 text-ink-tertiary">{content.demoDescription}</p>
        </aside>
      ) : null}
      <FormField
        error={errors.identifier?.message}
        id="sign-in-identifier"
        inputProps={{
          ...register("identifier"),
          autoComplete: "username",
          autoFocus: true,
          inputMode: "email",
          maxLength: 254,
        }}
        label={String(content.identifierLabel)}
      />
      <FormField
        error={errors.password?.message}
        id="sign-in-password"
        inputProps={{
          ...register("password"),
          autoComplete: "current-password",
          maxLength: 128,
          type: showPassword ? "text" : "password",
        }}
        label={String(content.passwordLabel)}
        trailingAction={
          <button
            aria-label={String(showPassword ? content.hidePassword : content.showPassword)}
            className="flex size-10 items-center justify-center rounded-sm border-0 bg-transparent text-ink-tertiary hover:bg-surface-subtle hover:text-ink"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        }
      />
      <div className="flex justify-end">
        <Link
          className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
          href={localizedRoute(locale, "/forgot-password")}
        >
          {content.forgotPassword}
        </Link>
      </div>
      <AuthErrorMessage error={submissionError} />
      <Button className="w-full" disabled={isSubmitting || isDemoSubmitting} type="submit">
        {isSubmitting ? content.signingInAction : content.signInAction}
      </Button>
      <p className="m-0 text-center text-sm text-ink-secondary">
        {content.noAccount}{" "}
        <Link
          className="font-semibold text-accent underline-offset-4 hover:underline"
          href={localizedRoute(locale, "/sign-up")}
        >
          {content.goToSignUp}
        </Link>
      </p>
    </form>
  );
}

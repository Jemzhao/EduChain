"use client";

import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { requestPasswordReset } from "@/data-access/mutations/auth";
import { localizedRoute } from "@/lib/routing/localized-route";

import { AuthErrorMessage } from "./auth-error-message";

type ResetRequestValues = { email: string };

const schema = z.object({ email: z.string().email().max(254) });

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  const [submissionError, setSubmissionError] = useState<unknown>();
  const [accepted, setAccepted] = useState(false);
  const [previewToken, setPreviewToken] = useState<string>();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<ResetRequestValues>({ defaultValues: { email: "" } });

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setSubmissionError(undefined);
    setAccepted(false);
    const result = schema.safeParse(values);
    if (!result.success) {
      setError("email", { type: "validate", message: String(content.validationEmail) });
      return;
    }
    try {
      const response = await requestPasswordReset({ email: result.data.email.trim() });
      setPreviewToken(response.previewToken ?? undefined);
      setAccepted(true);
    } catch (error) {
      setSubmissionError(error);
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <FormField
        error={errors.email?.message}
        id="reset-request-email"
        inputProps={{
          ...register("email"),
          autoComplete: "email",
          autoFocus: true,
          inputMode: "email",
          maxLength: 254,
          type: "email",
        }}
        label={String(content.emailLabel)}
      />
      <AuthErrorMessage error={submissionError} />
      {accepted ? (
        <div className="rounded-sm border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          <p className="m-0 font-medium">{content.resetRequestAccepted}</p>
          {previewToken ? (
            <div className="mt-4 border-t border-success/20 pt-4">
              <p className="m-0 font-semibold">{content.localResetTitle}</p>
              <p className="mt-1 mb-3 leading-6 opacity-90">{content.localResetDescription}</p>
              <Link
                className="inline-flex min-h-10 items-center rounded-sm bg-success px-4 font-semibold text-white no-underline"
                href={`${localizedRoute(locale, "/reset-password")}?token=${encodeURIComponent(previewToken)}`}
              >
                {content.continueReset}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? content.resetRequestPending : content.resetRequestAction}
      </Button>
      <p className="m-0 text-center text-sm text-ink-secondary">
        <Link
          className="font-semibold text-accent underline-offset-4 hover:underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.goToSignIn}
        </Link>
      </p>
    </form>
  );
}

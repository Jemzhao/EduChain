"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { ApiError } from "@/data-access/http/api-error";
import { completePasswordReset } from "@/data-access/mutations/auth";
import { localizedRoute } from "@/lib/routing/localized-route";

type ResetValues = { token: string; newPassword: string; confirmPassword: string };

const schema = z.object({
  token: z.string().trim().min(1).max(512),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
});

export function ResetPasswordForm({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  const searchParams = useSearchParams();
  const [complete, setComplete] = useState(false);
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<ResetValues>({
    defaultValues: {
      token: searchParams.get("token") ?? "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    clearErrors();
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ResetValues;
        setError(field, {
          type: "validate",
          message: String(
            field === "token" ? content.resetTokenInvalid : content.validationPassword,
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
      await completePasswordReset({
        token: result.data.token.trim(),
        newPassword: result.data.newPassword,
      });
      setComplete(true);
    } catch (error) {
      const code = error instanceof ApiError ? error.problem.code : undefined;
      setError("root", {
        type: "server",
        message: String(
          code === "PASSWORD_RESET_TOKEN_INVALID"
            ? content.resetTokenInvalid
            : code === "PASSWORD_REUSE_NOT_ALLOWED"
              ? content.passwordMismatch
              : content.errorGeneric,
        ),
      });
    }
  });

  if (complete) {
    return (
      <div className="rounded-sm border border-success/25 bg-success-soft p-5 text-sm text-success">
        <p className="m-0 font-semibold">{content.resetComplete}</p>
        <Link
          className="mt-4 inline-flex min-h-10 items-center rounded-sm bg-success px-4 font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.goToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <FormField
        error={errors.token?.message}
        id="reset-token"
        inputProps={{ ...register("token"), autoComplete: "off", maxLength: 512 }}
        label={String(content.resetTokenLabel)}
      />
      <FormField
        error={errors.newPassword?.message}
        id="reset-new-password"
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
        id="reset-confirm-password"
        inputProps={{
          ...register("confirmPassword"),
          autoComplete: "new-password",
          maxLength: 128,
          type: "password",
        }}
        label={String(content.confirmPasswordLabel)}
      />
      {errors.root?.message ? (
        <p className="rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? content.resettingAction : content.resetAction}
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

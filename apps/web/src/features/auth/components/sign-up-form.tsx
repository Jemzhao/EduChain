"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { registerAccount } from "@/data-access/mutations/auth";
import { localizedRoute } from "@/lib/routing/localized-route";

import { AuthErrorMessage } from "./auth-error-message";

type SignUpValues = {
  email: string;
  handle: string;
  displayName: string;
  password: string;
};

const schema = z.object({
  email: z.email().max(254),
  handle: z.string().regex(/^[a-z][a-z0-9_-]{2,31}$/),
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(12).max(128),
});

export function SignUpForm({ locale }: { locale: string }) {
  const content = useIntlayer("auth-page");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [submissionError, setSubmissionError] = useState<unknown>();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<SignUpValues>({
    defaultValues: { email: "", handle: "", displayName: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setSubmissionError(undefined);
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignUpValues;
        const messages = {
          email: content.validationEmail,
          handle: content.validationHandle,
          displayName: content.validationDisplayName,
          password: content.validationPassword,
        };
        setError(field, { type: "validate", message: String(messages[field]) });
      }
      return;
    }

    try {
      await registerAccount({
        ...result.data,
        email: result.data.email.trim().toLowerCase(),
        handle: result.data.handle.trim().toLowerCase(),
        displayName: result.data.displayName.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      router.push(localizedRoute(locale, "/settings/profile"));
    } catch (error) {
      setSubmissionError(error);
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <FormField
        error={errors.email?.message}
        id="sign-up-email"
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
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          description={String(content.handleDescription)}
          error={errors.handle?.message}
          id="sign-up-handle"
          inputProps={{
            ...register("handle"),
            autoCapitalize: "none",
            autoComplete: "username",
            maxLength: 32,
            spellCheck: false,
          }}
          label={String(content.handleLabel)}
        />
        <FormField
          error={errors.displayName?.message}
          id="sign-up-display-name"
          inputProps={{ ...register("displayName"), autoComplete: "name", maxLength: 80 }}
          label={String(content.displayNameLabel)}
        />
      </div>
      <FormField
        description={String(content.passwordDescription)}
        error={errors.password?.message}
        id="sign-up-password"
        inputProps={{
          ...register("password"),
          autoComplete: "new-password",
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
      <AuthErrorMessage error={submissionError} />
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? content.signingUpAction : content.signUpAction}
      </Button>
      <p className="m-0 text-center text-sm text-ink-secondary">
        {content.haveAccount}{" "}
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

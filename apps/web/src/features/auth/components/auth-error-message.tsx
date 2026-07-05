"use client";

import { useIntlayer } from "next-intlayer";

import { ApiError } from "@/data-access/http/api-error";

export function AuthErrorMessage({ error }: { error: unknown }) {
  const content = useIntlayer("auth-page");
  if (!error) return null;

  let message = content.errorGeneric;
  let requestId: string | undefined;
  if (error instanceof ApiError) {
    requestId = error.problem.requestId;
    switch (error.problem.code) {
      case "ACCOUNT_CREDENTIALS_INVALID":
        message = content.errorInvalidCredentials;
        break;
      case "ACCOUNT_IDENTIFIER_TAKEN":
        message = content.errorIdentifierTaken;
        break;
      case "ACCOUNT_RESTRICTED":
        message = content.errorRestricted;
        break;
      case "ACCOUNT_DISABLED":
        message = content.errorDisabled;
        break;
      case "FIELD_VALIDATION_FAILED":
      case "REQUEST_INVALID":
        message = content.errorValidation;
        break;
    }
  }

  return (
    <div
      className="rounded-sm border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
      role="alert"
    >
      <p className="m-0 font-medium">{message}</p>
      {requestId ? (
        <p className="mt-1 mb-0 font-mono text-xs opacity-80">
          {content.requestReference}: {requestId}
        </p>
      ) : null}
    </div>
  );
}

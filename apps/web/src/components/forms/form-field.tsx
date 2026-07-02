import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type SharedProps = {
  description?: string;
  error?: string;
  id: string;
  label: string;
  trailingAction?: ReactNode;
};

type InputFieldProps = SharedProps & {
  multiline?: false;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

type TextareaFieldProps = SharedProps & {
  multiline: true;
  inputProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
};

type FormFieldProps = InputFieldProps | TextareaFieldProps;

const inputClass =
  "min-h-12 w-full rounded-sm border border-border bg-surface px-3.5 text-base text-ink shadow-[inset_0_1px_1px_oklch(0.2_0.01_250/0.03)] outline-none transition-colors placeholder:text-ink-tertiary hover:border-border-strong focus:border-accent";

export function FormField({
  description,
  error,
  id,
  inputProps,
  label,
  multiline,
  trailingAction,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          {...inputProps}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`${inputClass} min-h-32 resize-y py-3 ${inputProps?.className ?? ""}`}
          id={id}
        />
      ) : (
        <div className="relative">
          <input
            {...inputProps}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={`${inputClass} ${trailingAction ? "pr-12" : ""} ${inputProps?.className ?? ""}`}
            id={id}
          />
          {trailingAction ? (
            <span className="absolute inset-y-0 right-1 flex items-center">{trailingAction}</span>
          ) : null}
        </div>
      )}
      {description ? (
        <p className="mt-2 text-xs leading-5 text-ink-tertiary" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
};

const variants = {
  primary:
    "border-accent bg-accent text-white shadow-[0_1px_1px_oklch(0.2_0.01_250/0.08)] hover:bg-accent-hover",
  secondary: "border-border bg-surface text-ink hover:bg-surface-subtle",
  quiet:
    "border-transparent bg-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink",
  danger: "border-danger/30 bg-danger-soft text-danger hover:border-danger/50",
} as const;

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-sm border px-5 py-2.5 text-sm font-semibold transition-colors duration-[var(--ed-duration-feedback)] disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

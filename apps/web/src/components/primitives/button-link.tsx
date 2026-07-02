import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonLinkProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
} & Pick<ComponentProps<typeof Link>, "href">;

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover border-accent shadow-[0_1px_1px_oklch(0.2_0.01_250/0.08)]",
  secondary: "bg-surface text-ink hover:bg-surface-subtle border-border",
} as const;

export function ButtonLink({ children, href, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center rounded-sm border px-5 py-2.5 text-sm font-semibold no-underline transition-colors duration-[var(--ed-duration-feedback)] ${variants[variant]}`}
      href={href}
    >
      {children}
    </Link>
  );
}

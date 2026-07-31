import type { PropsWithChildren } from "react";

type ContainerProps = PropsWithChildren<{
  className?: string;
  size?: "page" | "wide";
}>;

const maxWidths = {
  page: "max-w-[var(--ed-content-page)]",
  wide: "max-w-[96rem]",
} as const;

export function Container({ children, className = "", size = "page" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${maxWidths[size]} px-5 sm:px-8 ${className}`}>{children}</div>
  );
}

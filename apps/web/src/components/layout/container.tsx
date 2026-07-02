import type { PropsWithChildren } from "react";

type ContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-[var(--ed-content-page)] px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

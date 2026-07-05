import { Check } from "lucide-react";
import { useIntlayer } from "next-intlayer/server";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

type AuthShellProps = {
  children: ReactNode;
  description: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
};

export function AuthShell({ children, description, eyebrow, title }: AuthShellProps) {
  const content = useIntlayer("auth-page");

  return (
    <main className="py-12 sm:py-20" id="page-content">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_20px_60px_oklch(0.2_0.01_250/0.08)] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="p-7 sm:p-12 lg:p-14">
            <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-4 mb-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-lg leading-7 text-ink-secondary">{description}</p>
            <div className="mt-9">{children}</div>
          </section>
          <aside className="border-t border-border bg-surface-subtle p-7 sm:p-12 lg:border-t-0 lg:border-l lg:p-14">
            <div className="flex h-full flex-col justify-between gap-12">
              <div>
                <span className="block h-1 w-10 rounded-[var(--ed-radius-pill)] bg-accent" />
                <h2 className="mt-8 mb-0 text-2xl leading-tight font-semibold tracking-[-0.03em]">
                  {content.trustTitle}
                </h2>
                <p className="mt-4 leading-7 text-ink-secondary">{content.trustDescription}</p>
              </div>
              <ul className="m-0 list-none space-y-4 p-0">
                {[content.trustIdentity, content.trustSession, content.trustRecovery].map(
                  (item) => (
                    <li className="flex items-center gap-3 text-sm font-medium" key={String(item)}>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--ed-radius-pill)] bg-accent-soft text-accent">
                        <Check aria-hidden="true" className="size-3.5" />
                      </span>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}

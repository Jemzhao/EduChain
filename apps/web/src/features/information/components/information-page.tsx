import Link from "next/link";
import { useIntlayer } from "next-intlayer/server";
import type { ReactNode } from "react";

import { localizedRoute } from "@/lib/routing/localized-route";

export type InformationPageKey =
  | "help"
  | "guides"
  | "developers"
  | "changelog"
  | "terms"
  | "privacy"
  | "copyright"
  | "disclaimer"
  | "about"
  | "contact"
  | "cooperation";

export function InformationPage({ locale, page }: { locale: string; page: InformationPageKey }) {
  const content = useIntlayer("information-page");
  const data = content[page];
  const sections = data.sections as Array<{
    title: ReactNode;
    body: ReactNode;
    items?: ReactNode[];
  }>;
  return (
    <div className="mx-auto max-w-5xl">
      <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
        {data.eyebrow}
      </p>
      <h1 className="mt-4 mb-0 text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
        {data.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-secondary">{data.description}</p>
      <div className="mt-12 divide-y divide-border border-y border-border">
        {sections.map((section, index) => (
          <section
            className="grid gap-5 py-9 sm:grid-cols-[14rem_minmax(0,1fr)] sm:py-10"
            key={index}
          >
            <div>
              <span className="mb-3 block font-mono text-xs text-ink-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="m-0 text-xl font-semibold tracking-[-0.025em]">{section.title}</h2>
            </div>
            <div>
              <p className="m-0 leading-8 text-ink-secondary">{section.body}</p>
              {section.items?.length ? (
                <ul className="mt-5 mb-0 grid gap-3 pl-5 text-sm leading-6 text-ink-secondary marker:text-accent">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
      <Link
        className="mt-9 inline-flex text-sm font-semibold text-accent no-underline hover:underline"
        href={localizedRoute(locale)}
      >
        {content.backHome}
      </Link>
    </div>
  );
}

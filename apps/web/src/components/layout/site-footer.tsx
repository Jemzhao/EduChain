"use client";

import Link from "next/link";
import { useIntlayer, useLocale } from "next-intlayer";

import { Container } from "@/components/layout/container";
import { localizedRoute } from "@/lib/routing/localized-route";

export function SiteFooter() {
  const content = useIntlayer("global-navigation");
  const { locale } = useLocale();
  const links = [
    ["/help", content.help],
    ["/guides", content.guides],
    ["/developers", content.developers],
    ["/changelog", content.changelog],
    ["/about", content.about],
    ["/contact", content.contact],
    ["/support", content.support],
    ["/external-content", content.externalContent],
    ["/cooperation", content.cooperation],
    ["/legal/terms", content.terms],
    ["/legal/privacy", content.privacy],
    ["/legal/copyright", content.copyright],
    ["/legal/disclaimer", content.disclaimer],
  ] as const;
  return (
    <footer className="border-t border-border py-9">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <p className="m-0 text-sm font-semibold">EduChain</p>
        <nav
          aria-label={String(content.information)}
          className="flex max-w-4xl flex-wrap gap-x-5 gap-y-3"
        >
          {links.map(([path, label]) => (
            <Link
              className="text-xs text-ink-tertiary no-underline hover:text-ink"
              href={localizedRoute(locale, path)}
              key={path}
            >
              {label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}

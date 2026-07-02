import Link from "next/link";
import { useIntlayer } from "next-intlayer/server";

import { Container } from "./container";
import { SessionNavigation } from "./session-navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { localizedRoute } from "@/lib/routing/localized-route";

type SiteHeaderProps = {
  locale: string;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const content = useIntlayer("global-navigation");
  const alternateLocale = locale === "en" ? "zh-CN" : "en";
  const alternateLabel = locale === "en" ? content.chinese : content.english;

  return (
    <header className="border-b border-border bg-canvas/90 backdrop-blur-sm">
      <a
        className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-canvas no-underline focus:translate-y-0"
        href="#page-content"
      >
        {content.skipToContent}
      </a>
      <Container className="flex min-h-16 items-center justify-between gap-6">
        <Link
          className="text-base font-semibold tracking-[-0.02em] no-underline"
          href={localizedRoute(locale)}
        >
          {content.brand}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5" aria-label={String(content.brand)}>
          <Link
            className="hidden rounded-sm px-2 py-2 text-sm text-ink-secondary no-underline hover:text-ink sm:inline-flex"
            href={localizedRoute(locale, "/discover")}
          >
            {content.discover}
          </Link>
          <Link
            className="hidden rounded-sm px-2 py-2 text-sm text-ink-secondary no-underline hover:text-ink lg:inline-flex"
            href={localizedRoute(locale, "/community")}
          >
            {content.community}
          </Link>
          <Link
            className="hidden rounded-sm px-2 py-2 text-sm text-ink-secondary no-underline hover:text-ink sm:inline-flex"
            href={localizedRoute(locale, "/verify")}
          >
            {content.verify}
          </Link>
          <Link
            className="hidden rounded-sm px-2 py-2 text-sm text-ink-secondary no-underline hover:text-ink xl:inline-flex"
            href={localizedRoute(locale, "/ledger")}
          >
            {content.ledger}
          </Link>
          <ThemeSwitcher />
          <Link
            aria-label={String(content.languageLabel)}
            className="inline-flex min-h-10 items-center rounded-sm border border-border bg-surface px-3 text-sm font-medium no-underline hover:bg-surface-subtle"
            href={localizedRoute(alternateLocale)}
            hrefLang={alternateLocale}
          >
            {alternateLabel}
          </Link>
          <SessionNavigation locale={locale} />
        </nav>
      </Container>
    </header>
  );
}

import Link from "next/link";
import { useIntlayer } from "next-intlayer/server";

import { Container } from "./container";
import { MobileNavigation } from "./mobile-navigation";
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
      <Container className="flex min-h-16 items-center justify-between gap-3">
        <Link
          className="shrink-0 text-base font-semibold tracking-[-0.02em] no-underline"
          href={localizedRoute(locale)}
        >
          {content.brand}
        </Link>
        <nav
          className="flex min-w-0 items-center gap-2 xl:gap-5"
          aria-label={String(content.brand)}
        >
          <Link
            className="hidden min-h-10 items-center whitespace-nowrap rounded-sm px-2 text-sm text-ink-secondary no-underline hover:text-ink xl:inline-flex"
            href={localizedRoute(locale, "/discover")}
          >
            {content.discover}
          </Link>
          <Link
            className="hidden min-h-10 items-center whitespace-nowrap rounded-sm px-2 text-sm text-ink-secondary no-underline hover:text-ink xl:inline-flex"
            href={localizedRoute(locale, "/community")}
          >
            {content.community}
          </Link>
          <Link
            className="hidden min-h-10 items-center whitespace-nowrap rounded-sm px-2 text-sm text-ink-secondary no-underline hover:text-ink xl:inline-flex"
            href={localizedRoute(locale, "/verify")}
          >
            {content.verify}
          </Link>
          <Link
            className="hidden min-h-10 items-center whitespace-nowrap rounded-sm px-2 text-sm text-ink-secondary no-underline hover:text-ink xl:inline-flex"
            href={localizedRoute(locale, "/ledger")}
          >
            {content.ledger}
          </Link>
          <div className="hidden shrink-0 items-center gap-2 sm:flex xl:gap-5">
            <ThemeSwitcher />
            <Link
              aria-label={String(content.languageLabel)}
              className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-sm border border-border bg-surface px-3 text-sm font-medium no-underline hover:bg-surface-subtle"
              href={localizedRoute(alternateLocale)}
              hrefLang={alternateLocale}
            >
              {alternateLabel}
            </Link>
            <SessionNavigation locale={locale} />
          </div>
          <MobileNavigation locale={locale} />
        </nav>
      </Container>
    </header>
  );
}

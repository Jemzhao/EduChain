"use client";

import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useEffect, useId, useRef, useState } from "react";

import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { getCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type MobileNavigationProps = {
  locale: string;
};

export function MobileNavigation({ locale }: MobileNavigationProps) {
  const content = useIntlayer("global-navigation");
  const alternateLocale = locale === "en" ? "zh-CN" : "en";
  const alternateLabel = locale === "en" ? content.chinese : content.english;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentUser = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const canAdminister = currentUser.data?.roles.some(
    (role) => role === "MODERATOR" || role === "ADMINISTRATOR",
  );

  useEffect(() => {
    if (!open) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const close = () => setOpen(false);
  const primaryLinks = [
    ["/discover", content.discover],
    ["/community", content.community],
    ["/verify", content.verify],
    ["/ledger", content.ledger],
  ] as const;
  const accountLinks: ReadonlyArray<readonly [string, React.ReactNode]> = currentUser.data
    ? [
        ["/library", content.library],
        ["/activity", content.activity],
        ["/notifications", content.notifications],
        ["/studio", content.create],
        ["/settings/profile", content.profile],
        ...(canAdminister ? [["/admin", content.administration] as const] : []),
      ]
    : [["/sign-in", content.signIn]];

  return (
    <div className="relative shrink-0 xl:hidden" ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={String(open ? content.closeMenu : content.openMenu)}
        className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-ink-secondary hover:bg-surface-subtle hover:text-ink"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      {open ? (
        <div
          className="absolute top-[calc(100%+0.65rem)] right-0 z-50 max-h-[calc(100dvh-5.5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-md border border-border-strong bg-canvas p-3 shadow-[0_18px_50px_oklch(0.2_0.01_250/0.16)]"
          id={panelId}
        >
          <nav aria-label={String(content.primaryNavigation)} className="grid gap-1 sm:grid-cols-2">
            {primaryLinks.map(([path, label]) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-semibold no-underline hover:bg-surface-subtle hover:text-accent"
                href={localizedRoute(locale, path)}
                key={path}
                onClick={close}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="my-3 border-t border-border" />

          <nav aria-label={String(content.accountNavigation)} className="grid gap-1 sm:grid-cols-2">
            {accountLinks.map(([path, label]) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink"
                href={localizedRoute(locale, path)}
                key={path}
                onClick={close}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <ThemeSwitcher className="w-full" showLabel />
            <Link
              aria-label={String(content.languageLabel)}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-sm border border-border bg-surface px-3 text-sm font-medium no-underline hover:bg-surface-subtle"
              href={localizedRoute(alternateLocale)}
              hrefLang={alternateLocale}
              onClick={close}
            >
              {alternateLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

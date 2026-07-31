"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useSyncExternalStore } from "react";

import {
  readThemePreference,
  subscribeToThemePreference,
  type ThemePreference,
  themePreferences,
  writeThemePreference,
} from "@/lib/theme/theme-preference";

const icons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} satisfies Record<ThemePreference, typeof Monitor>;

export function ThemeSwitcher({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const content = useIntlayer("global-navigation");
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeToThemePreference,
    readThemePreference,
    () => "system",
  );
  const currentIndex = themePreferences.indexOf(preference);
  const nextPreference = themePreferences[(currentIndex + 1) % themePreferences.length];
  const labels = {
    system: String(content.themeSystem),
    light: String(content.themeLight),
    dark: String(content.themeDark),
  } satisfies Record<ThemePreference, string>;
  const Icon = icons[preference];
  const accessibleLabel = `${content.themeLabel}: ${labels[preference]}. ${content.themeSwitchTo} ${labels[nextPreference]}`;

  return (
    <button
      aria-label={accessibleLabel}
      className={`inline-flex min-h-10 min-w-10 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink ${showLabel ? "justify-start" : "justify-center"} ${className}`}
      onClick={() => writeThemePreference(nextPreference)}
      title={accessibleLabel}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className={showLabel ? "inline" : "hidden 2xl:inline"} aria-live="polite">
        {labels[preference]}
      </span>
    </button>
  );
}

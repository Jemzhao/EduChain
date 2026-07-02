export const themeStorageKey = "educhain.theme";
export const themeChangeEvent = "educhain:theme-change";

export const themePreferences = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && themePreferences.includes(value as ThemePreference);
}

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function subscribeToThemePreference(listener: () => void): () => void {
  window.addEventListener(themeChangeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(themeChangeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

export function writeThemePreference(preference: ThemePreference): void {
  document.documentElement.dataset.theme = preference;
  try {
    window.localStorage.setItem(themeStorageKey, preference);
  } catch {
    // The active document still receives the preference when storage is unavailable.
  }
  window.dispatchEvent(new Event(themeChangeEvent));
}

export const themeInitializationScript = `(() => {
  const allowed = new Set(${JSON.stringify(themePreferences)});
  let preference = "system";
  try {
    const stored = window.localStorage.getItem(${JSON.stringify(themeStorageKey)});
    if (allowed.has(stored)) preference = stored;
  } catch {}
  document.documentElement.dataset.theme = preference;
})();`;

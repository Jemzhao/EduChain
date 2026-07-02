import type { Route } from "next";

export function localizedRoute(locale: string, suffix = ""): Route {
  return `/${locale}${suffix}` as Route;
}

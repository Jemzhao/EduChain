"use client";

import type { PropsWithChildren } from "react";

import { MockProvider } from "./mock-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MockProvider>
      <QueryProvider>{children}</QueryProvider>
    </MockProvider>
  );
}

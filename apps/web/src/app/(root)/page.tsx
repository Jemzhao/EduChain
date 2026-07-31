"use client";

import { useEffect } from "react";

import { publicEnvironment } from "@/lib/env/public";

function localePath(locale: "en" | "zh-CN"): string {
  return `${publicEnvironment.basePath}/${locale}/`;
}

export default function RootRedirectPage() {
  useEffect(() => {
    const locale = navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
    window.location.replace(localePath(locale));
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <span
          aria-hidden="true"
          className="mx-auto mb-5 block size-2.5 animate-pulse rounded-full bg-accent"
        />
        <h1 className="m-0 text-xl font-semibold text-ink">EduChain</h1>
        <p className="mt-3 mb-0 text-sm leading-6 text-ink-secondary">
          正在进入演示站点 · Opening the demo
        </p>
        <nav className="mt-6 flex justify-center gap-4" aria-label="Language">
          <a className="font-semibold text-accent" href={localePath("zh-CN")}>
            中文
          </a>
          <a className="font-semibold text-accent" href={localePath("en")}>
            English
          </a>
        </nav>
      </section>
    </main>
  );
}

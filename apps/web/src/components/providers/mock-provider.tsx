"use client";

import { useIntlayer } from "next-intlayer";
import { type PropsWithChildren, useEffect, useState } from "react";

import { Button } from "@/components/primitives/button";
import { publicEnvironment } from "@/lib/env/public";

const mockServiceWorkerPath = "/mockServiceWorker.js";

function isMockServiceWorker(scriptUrl: string | undefined): boolean {
  if (!scriptUrl) {
    return false;
  }

  try {
    return new URL(scriptUrl).pathname === mockServiceWorkerPath;
  } catch {
    return false;
  }
}

async function removeStaleMockServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const controlledByMock = isMockServiceWorker(navigator.serviceWorker.controller?.scriptURL);
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations.map(async (registration) => {
      const workers = [registration.active, registration.waiting, registration.installing];
      if (workers.some((worker) => isMockServiceWorker(worker?.scriptURL))) {
        await registration.unregister();
      }
    }),
  );

  return controlledByMock;
}

export function MockProvider({ children }: PropsWithChildren) {
  const content = useIntlayer("system-status");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (publicEnvironment.apiMode !== "mock") {
      let active = true;

      void removeStaleMockServiceWorker()
        .then((reloadRequired) => {
          if (!active) {
            return;
          }
          if (reloadRequired) {
            window.location.reload();
            return;
          }
          setReady(true);
        })
        .catch(() => {
          if (active) {
            setFailed(true);
          }
        });

      return () => {
        active = false;
      };
    }

    let active = true;

    void import("@/mocks/browser")
      .then(async ({ ensureMockWorker }) => {
        await ensureMockWorker();
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (ready) {
    return children;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <section
        aria-live="polite"
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm"
      >
        <span
          aria-hidden="true"
          className={`mx-auto mb-5 block size-2.5 rounded-full ${failed ? "bg-danger" : "animate-pulse bg-accent"}`}
        />
        <p className="m-0 text-sm font-semibold text-ink">
          {failed ? content.unavailable : content.checking}
        </p>
        {failed ? (
          <Button
            className="mt-5"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            {content.retry}
          </Button>
        ) : null}
      </section>
    </main>
  );
}

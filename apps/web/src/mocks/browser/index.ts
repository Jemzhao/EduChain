import { setupWorker } from "msw/browser";

import { handlers } from "@/mocks/handlers";
import { publicEnvironment } from "@/lib/env/public";

type MockRuntime = {
  startPromise?: Promise<ServiceWorkerRegistration | undefined>;
  worker: ReturnType<typeof setupWorker>;
};

declare global {
  interface Window {
    __educhainMockRuntime?: MockRuntime;
  }
}

const runtime = (window.__educhainMockRuntime ??= {
  worker: setupWorker(...handlers),
});

runtime.worker.resetHandlers(...handlers);

export async function ensureMockWorker(): Promise<void> {
  if (!runtime.startPromise) {
    const pendingStart = runtime.worker.start({
      onUnhandledRequest(request, print) {
        const path = new URL(request.url).pathname;
        if (
          path === publicEnvironment.apiBaseUrl ||
          path.startsWith(`${publicEnvironment.apiBaseUrl}/`)
        ) {
          print.error();
        }
      },
      quiet: true,
    });

    runtime.startPromise = pendingStart;
    void pendingStart.catch(() => {
      if (runtime.startPromise === pendingStart) {
        runtime.startPromise = undefined;
      }
    });
  }

  await runtime.startPromise;
}

import { delay, http, HttpResponse } from "msw";

import { availableService } from "@/mocks/fixtures/system";
import { adminState } from "@/mocks/state/admin";

export const systemHandlers = [
  http.get("*/api/v1/health", async () => {
    await delay(120);
    return HttpResponse.json(availableService);
  }),
  http.get("*/api/v1/platform-settings", async () => {
    await delay(70);
    return HttpResponse.json({
      items: adminState.settings().items.filter((item) => item.publicVisible),
    });
  }),
];

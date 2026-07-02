import type { paths } from "@educhain/api-contract";
import createClient from "openapi-fetch";

import { publicEnvironment } from "@/lib/env/public";

export const apiClient = createClient<paths>({
  baseUrl: publicEnvironment.apiBaseUrl,
  credentials: "include",
  headers: {
    Accept: "application/json, application/problem+json",
  },
});

import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type Quality = components["schemas"]["ExternalContentQualityStatus"];

export const getExternalContent = async (query = "") =>
  unwrapApiResult(
    await apiClient.GET("/external-content", { params: { query: { query, limit: 50 } } }),
  );

export const getAdminExternalSources = async () =>
  unwrapApiResult(await apiClient.GET("/admin/external-content/sources"));

export const getAdminExternalItems = async (status?: Quality) =>
  unwrapApiResult(
    await apiClient.GET("/admin/external-content/items", {
      params: { query: { status, limit: 50 } },
    }),
  );

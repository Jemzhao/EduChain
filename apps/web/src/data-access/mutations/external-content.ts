import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { unwrapApiResult } from "@/data-access/http/result";

type SourceWrite = components["schemas"]["ExternalContentSourceWriteRequest"];
type Quality = components["schemas"]["ExternalContentQualityStatus"];

const writeHeaders = async () => ({ "X-XSRF-TOKEN": await getCsrfToken() });

export const createAdminExternalSource = async (body: SourceWrite) =>
  unwrapApiResult(
    await apiClient.POST("/admin/external-content/sources", {
      body,
      headers: await writeHeaders(),
    }),
  );

export const updateAdminExternalSource = async (
  sourceId: string,
  version: number,
  body: SourceWrite,
) =>
  unwrapApiResult(
    await apiClient.PUT("/admin/external-content/sources/{sourceId}", {
      body,
      params: { path: { sourceId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );

export const syncAdminExternalSource = async (sourceId: string, reason: string) =>
  unwrapApiResult(
    await apiClient.POST("/admin/external-content/sources/{sourceId}/sync", {
      body: { reason },
      params: { path: { sourceId } },
      headers: await writeHeaders(),
    }),
  );

export const reviewAdminExternalItem = async (
  itemId: string,
  version: number,
  status: Quality,
  reason: string,
) =>
  unwrapApiResult(
    await apiClient.PUT("/admin/external-content/items/{itemId}/review", {
      body: { status, reason },
      params: { path: { itemId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );

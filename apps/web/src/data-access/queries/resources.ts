import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type ResourceSort = components["schemas"]["ResourceSort"];

export async function getResource(resourceKey: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceKey}", {
      params: { path: { resourceKey } },
    }),
  );
}

export async function getResourceDraft(resourceId: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/draft", {
      params: { path: { resourceId } },
    }),
  );
}

export async function listMyResources(status?: components["schemas"]["ResourceStatus"]) {
  return unwrapApiResult(
    await apiClient.GET("/users/me/resources", {
      params: { query: { status } },
    }),
  );
}

export async function listResourceVersions(resourceId: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/versions", {
      params: { path: { resourceId } },
    }),
  );
}

export async function getResourceStatistics(resourceId: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/statistics", {
      params: { path: { resourceId } },
    }),
  );
}

export async function listRecommendedResources(limit = 12) {
  return unwrapApiResult(
    await apiClient.GET("/recommendations/resources", {
      params: { query: { limit } },
    }),
  );
}

export async function listResources(
  options: {
    category?: string;
    tag?: string;
    cursor?: string;
    limit?: number;
    sort?: ResourceSort;
  } = {},
) {
  return unwrapApiResult(
    await apiClient.GET("/resources", {
      params: { query: options },
    }),
  );
}

export async function searchResources(options: {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  sort?: ResourceSort;
  cursor?: string;
  limit?: number;
}) {
  return unwrapApiResult(
    await apiClient.GET("/search/resources", {
      params: { query: options },
    }),
  );
}

export async function getSearchSuggestions(query: string) {
  return unwrapApiResult(
    await apiClient.GET("/search/suggestions", { params: { query: { query } } }),
  );
}

export async function getPopularSearchKeywords(limit = 10) {
  return unwrapApiResult(
    await apiClient.GET("/search/popular-keywords", { params: { query: { limit } } }),
  );
}

export async function getSearchHistory(limit = 20) {
  return unwrapApiResult(
    await apiClient.GET("/users/me/search-history", { params: { query: { limit } } }),
  );
}

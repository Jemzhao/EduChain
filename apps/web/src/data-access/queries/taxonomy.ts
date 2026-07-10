import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

export async function getCategories() {
  return unwrapApiResult(await apiClient.GET("/categories"));
}

export async function getTags(query = "", limit = 50) {
  return unwrapApiResult(await apiClient.GET("/tags", { params: { query: { query, limit } } }));
}

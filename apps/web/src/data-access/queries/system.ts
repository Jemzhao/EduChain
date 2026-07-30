import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

export async function getServiceHealth() {
  const result = await apiClient.GET("/health");
  return unwrapApiResult(result);
}

import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type VerificationRequest = components["schemas"]["CreateVerificationRequest"];

export async function createVerification(body: VerificationRequest) {
  return unwrapApiResult(await apiClient.POST("/verifications", { body }));
}

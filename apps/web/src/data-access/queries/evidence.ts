import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

export async function getResourceEvidence(resourceId: string) {
  return unwrapApiResult(
    await apiClient.GET("/resources/{resourceId}/evidence", {
      params: { path: { resourceId } },
    }),
  );
}

export async function getPublicEvidence(proofId: string) {
  return unwrapApiResult(
    await apiClient.GET("/evidence/{proofId}", {
      params: { path: { proofId } },
    }),
  );
}

export async function listLedgerBlocks(limit = 20) {
  return unwrapApiResult(await apiClient.GET("/ledger/blocks", { params: { query: { limit } } }));
}

export async function getLedgerBlock(
  backend: "SIMULATOR" | "CHAINMAKER",
  networkId: string,
  blockHeight: number,
) {
  return unwrapApiResult(
    await apiClient.GET("/ledger/blocks/{backend}/{networkId}/{blockHeight}", {
      params: { path: { backend, networkId, blockHeight } },
    }),
  );
}

export async function getLedgerTransaction(transactionId: string) {
  return unwrapApiResult(
    await apiClient.GET("/ledger/transactions/{transactionId}", {
      params: { path: { transactionId }, query: {} },
    }),
  );
}

export async function searchLedger(query: string, limit = 20) {
  return unwrapApiResult(
    await apiClient.GET("/ledger/search", { params: { query: { query, limit } } }),
  );
}

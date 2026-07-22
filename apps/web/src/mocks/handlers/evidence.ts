import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireAuth } from "@/mocks/request-guards";
import { resourceState } from "@/mocks/state/resources";
import { evidenceState } from "@/mocks/state/evidence";

type VerificationRequest = components["schemas"]["CreateVerificationRequest"];

const certificatePdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 54>>stream
BT /F1 12 Tf 72 720 Td (EduChain Mock Certificate) Tj ET
endstream endobj
trailer<</Root 1 0 R>>
%%EOF`;

export const evidenceHandlers = [
  http.get("*/api/v1/ledger/blocks", async ({ request }) => {
    await delay(100);
    const limit = Math.min(
      50,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 20)),
    );
    return HttpResponse.json({
      items: evidenceState.ledgerBlocks().slice(0, limit),
      scope: "APPLICATION_EVIDENCE" as const,
    });
  }),

  http.get(
    "*/api/v1/ledger/blocks/:backend/:networkId/:blockHeight",
    async ({ params, request }) => {
      await delay(90);
      const block = evidenceState.ledgerBlock(
        String(params.backend),
        decodeURIComponent(String(params.networkId)),
        Number(params.blockHeight),
      );
      return block
        ? HttpResponse.json(block)
        : problemResponse({ status: 404, code: "EVIDENCE_NOT_FOUND", path: pathOf(request) });
    },
  ),

  http.get("*/api/v1/ledger/transactions/:transactionId", async ({ params, request }) => {
    await delay(90);
    const transaction = evidenceState.ledgerTransaction(String(params.transactionId));
    return transaction
      ? HttpResponse.json(transaction)
      : problemResponse({ status: 404, code: "EVIDENCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.get("*/api/v1/ledger/search", async ({ request }) => {
    await delay(90);
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    return HttpResponse.json(evidenceState.ledgerSearch(query, limit));
  }),

  http.get("*/api/v1/resources/:resourceId/evidence", async ({ params, request }) => {
    await delay(110);
    const resourceId = String(params.resourceId);
    const evidence = evidenceState.forResource(resourceId);
    if (evidence) return HttpResponse.json(evidence);
    if (resourceState.get(resourceId)) return HttpResponse.json(evidenceState.pending(resourceId));
    return problemResponse({ status: 404, code: "RESOURCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.get("*/api/v1/evidence-jobs/:jobId", async ({ params, request }) => {
    await delay(90);
    const authentication = requireAuth(request);
    if (authentication) return authentication;
    const job = evidenceState.job(String(params.jobId));
    return job
      ? HttpResponse.json(job)
      : problemResponse({ status: 404, code: "EVIDENCE_JOB_NOT_FOUND", path: pathOf(request) });
  }),

  http.get("*/api/v1/evidence/:proofId", async ({ params, request }) => {
    await delay(100);
    const proof = evidenceState.proof(String(params.proofId));
    return proof
      ? HttpResponse.json(proof)
      : problemResponse({ status: 404, code: "EVIDENCE_NOT_FOUND", path: pathOf(request) });
  }),

  http.get("*/api/v1/evidence/:proofId/certificate", async ({ params, request }) => {
    await delay(120);
    const proof = evidenceState.proof(String(params.proofId));
    if (!proof) {
      return problemResponse({ status: 404, code: "EVIDENCE_NOT_FOUND", path: pathOf(request) });
    }
    return new HttpResponse(certificatePdf, {
      headers: {
        "Content-Disposition": `inline; filename="educhain-evidence-${proof.proofId}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  }),

  http.post("*/api/v1/verifications", async ({ request }) => {
    await delay(180);
    const body = (await request.json()) as VerificationRequest;
    if (!/^[a-fA-F0-9]{64}$/.test(body.contentDigest)) {
      return problemResponse({
        status: 422,
        code: "VALIDATION_FAILED",
        path: pathOf(request),
        fieldErrors: [{ field: "contentDigest", code: "INVALID_SHA256" }],
      });
    }
    if (
      (body.proofId && body.transactionId) ||
      (body.transactionId && !/^[a-zA-Z0-9._:-]{16,160}$/.test(body.transactionId))
    ) {
      return problemResponse({
        status: 422,
        code: "FIELD_VALIDATION_FAILED",
        path: pathOf(request),
      });
    }
    return HttpResponse.json(evidenceState.verify(body));
  }),
];

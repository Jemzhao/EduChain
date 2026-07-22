import type { components } from "@educhain/api-contract";

import { mockNow } from "@/mocks/clock";
import { mockPublishedResources } from "@/mocks/fixtures/resources";

type PublicEvidence = components["schemas"]["PublicEvidenceResponse"];
type ResourceEvidence = components["schemas"]["ResourceEvidenceResponse"];
type VerificationRequest = components["schemas"]["CreateVerificationRequest"];
type VerificationResponse = components["schemas"]["VerificationResponse"];
type EvidenceJob = components["schemas"]["EvidenceJobResponse"];

const confirmedResources = mockPublishedResources.filter(
  (resource) => resource.evidenceStatus === "CONFIRMED",
);

const proofs = new Map<string, PublicEvidence>(
  confirmedResources.map((resource, index) => {
    const simulator = index % 4 !== 3;
    const suffix = String(index + 1).padStart(12, "0");
    const proofId = `55000000-0000-4000-8000-${suffix}`;
    const publishedAt = new Date(resource.publishedAt).getTime();
    const proof: PublicEvidence = {
      proofId,
      resourceId: resource.id,
      resourceSlug: resource.slug,
      resourceTitle: resource.title,
      versionId: resource.versionId,
      versionNumber: resource.versionNumber,
      author: resource.author,
      backend: simulator ? "SIMULATOR" : "CHAINMAKER",
      networkId: simulator ? "educhain-local-simulator" : "chainmaker-education-demo",
      transactionId: (index + 101).toString(16).padStart(64, "0"),
      blockHeight: simulator ? 1042 + index : 32871 + index,
      blockHash: (index + 501).toString(16).padStart(64, "0"),
      contentDigest: resource.contentDigest,
      attachmentMerkleRoot: null,
      canonicalizationVersion: "educhain-c14n-v1",
      payloadVersion: 1,
      submittedAt: new Date(publishedAt + 30_000).toISOString(),
      confirmedAt: new Date(publishedAt + 90_000).toISOString(),
      certificateStatus: "AVAILABLE",
      certificateUrl: `/api/v1/evidence/${proofId}/certificate`,
    };
    return [proof.proofId, proof];
  }),
);

const proofByResource = new Map([...proofs.values()].map((proof) => [proof.resourceId, proof]));

function resourceSuffix(resourceId: string) {
  return resourceId.slice(-12);
}

export const evidenceState = {
  forResource(resourceId: string): ResourceEvidence | undefined {
    const resource = mockPublishedResources.find((item) => item.id === resourceId);
    if (!resource) return undefined;
    const proof = proofByResource.get(resourceId);
    if (proof) {
      return {
        resourceId,
        jobId: `55200000-0000-4000-8000-${resourceSuffix(resourceId)}`,
        status: "COMPLETED",
        backend: proof.backend,
        proof: structuredClone(proof),
        retryable: false,
        errorCode: null,
      };
    }
    const pending = resource.evidenceStatus === "PENDING";
    return {
      resourceId,
      jobId: pending ? null : `55200000-0000-4000-8000-${resourceSuffix(resourceId)}`,
      status: pending ? "PENDING" : "ACCEPTED",
      backend: "SIMULATOR",
      proof: null,
      retryable: !pending,
      errorCode: null,
    };
  },

  pending(resourceId: string): ResourceEvidence {
    return {
      resourceId,
      jobId: null,
      status: "PENDING",
      backend: "SIMULATOR",
      proof: null,
      retryable: true,
      errorCode: null,
    };
  },

  job(jobId: string): EvidenceJob | undefined {
    const item = mockPublishedResources
      .map((resource) => this.forResource(resource.id))
      .find((candidate) => candidate?.jobId === jobId);
    if (!item?.jobId) return undefined;
    const proof = item.proof;
    const resource = mockPublishedResources.find((candidate) => candidate.id === item.resourceId)!;
    return {
      id: item.jobId,
      resourceId: item.resourceId,
      versionId: resource.versionId,
      backend: item.backend,
      status: item.status,
      attemptCount: item.status === "ACCEPTED" ? 0 : 1,
      retryable: item.retryable,
      errorCode: item.errorCode,
      nextAttemptAt: null,
      createdAt: proof?.submittedAt ?? resource.publishedAt,
      updatedAt: proof?.confirmedAt ?? resource.publishedAt,
    };
  },

  proof(proofId: string): PublicEvidence | undefined {
    const proof = proofs.get(proofId);
    return proof ? structuredClone(proof) : undefined;
  },

  ledgerBlocks() {
    const blocks = new Map<
      string,
      {
        backend: PublicEvidence["backend"];
        networkId: string;
        blockHeight: number;
        blockHash: string;
        transactionCount: number;
        confirmedAt: string;
      }
    >();
    for (const proof of proofs.values()) {
      const blockHeight = proof.blockHeight;
      if (blockHeight == null || !proof.blockHash || !proof.transactionId) continue;
      const key = `${proof.backend}:${proof.networkId}:${blockHeight}`;
      const block = blocks.get(key) ?? {
        backend: proof.backend,
        networkId: proof.networkId,
        blockHeight,
        blockHash: proof.blockHash,
        transactionCount: 0,
        confirmedAt: proof.confirmedAt,
      };
      block.transactionCount += 1;
      if (proof.confirmedAt > block.confirmedAt) block.confirmedAt = proof.confirmedAt;
      blocks.set(key, block);
    }
    return [...blocks.values()].toSorted((left, right) =>
      right.confirmedAt.localeCompare(left.confirmedAt),
    );
  },

  ledgerBlock(backend: string, networkId: string, blockHeight: number) {
    const transactions = [...proofs.values()]
      .filter(
        (proof) =>
          proof.backend === backend &&
          proof.networkId === networkId &&
          proof.blockHeight === blockHeight &&
          proof.transactionId,
      )
      .map(ledgerTransaction);
    const block = this.ledgerBlocks().find(
      (item) =>
        item.backend === backend &&
        item.networkId === networkId &&
        item.blockHeight === blockHeight,
    );
    return block ? { block, transactions, scope: "APPLICATION_EVIDENCE" as const } : undefined;
  },

  ledgerTransaction(transactionId: string) {
    const proof = [...proofs.values()].find((item) => item.transactionId === transactionId);
    return proof ? ledgerTransaction(proof) : undefined;
  },

  ledgerSearch(query: string, limit: number) {
    const normalized = query.trim().toLowerCase();
    return {
      items: [...proofs.values()]
        .flatMap((proof) => {
          const kind =
            proof.proofId.toLowerCase() === normalized
              ? "PROOF"
              : proof.transactionId?.toLowerCase() === normalized
                ? "TRANSACTION"
                : String(proof.blockHeight) === normalized
                  ? "BLOCK"
                  : proof.contentDigest.toLowerCase() === normalized
                    ? "DIGEST"
                    : undefined;
          return kind
            ? [
                {
                  kind,
                  proofId: proof.proofId,
                  transactionId: proof.transactionId,
                  backend: proof.backend,
                  networkId: proof.networkId,
                  blockHeight: proof.blockHeight,
                  contentDigest: proof.contentDigest,
                  confirmedAt: proof.confirmedAt,
                },
              ]
            : [];
        })
        .slice(0, limit),
      scope: "APPLICATION_EVIDENCE" as const,
    };
  },

  verify(request: VerificationRequest): VerificationResponse {
    const targetedProof = request.proofId
      ? proofs.get(request.proofId)
      : request.transactionId
        ? [...proofs.values()].find((proof) => proof.transactionId === request.transactionId)
        : undefined;
    const matchingProof =
      targetedProof ??
      [...proofs.values()].find(
        (proof) => proof.contentDigest.toLowerCase() === request.contentDigest.toLowerCase(),
      );
    const result =
      request.proofId || request.transactionId
        ? !targetedProof
          ? "NOT_FOUND"
          : targetedProof.contentDigest.toLowerCase() === request.contentDigest.toLowerCase()
            ? "MATCHED"
            : "MISMATCHED"
        : matchingProof
          ? "MATCHED"
          : "NOT_FOUND";

    return {
      id: crypto.randomUUID(),
      result,
      method: request.method,
      checkedDigest: request.contentDigest.toLowerCase(),
      proof: matchingProof ? structuredClone(matchingProof) : null,
      checkedAt: mockNow(),
    };
  },
};

function ledgerTransaction(proof: PublicEvidence) {
  return {
    transactionId: proof.transactionId!,
    backend: proof.backend,
    networkId: proof.networkId,
    blockHeight: proof.blockHeight,
    blockHash: proof.blockHash,
    proofId: proof.proofId,
    resourceId: proof.resourceId,
    versionId: proof.versionId,
    contentDigest: proof.contentDigest,
    submittedAt: proof.submittedAt,
    confirmedAt: proof.confirmedAt,
  };
}

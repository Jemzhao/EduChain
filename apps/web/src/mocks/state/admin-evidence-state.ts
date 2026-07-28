import { mockNow } from "@/mocks/clock";
import { evidenceState } from "@/mocks/state/evidence";
import { resourceState } from "@/mocks/state/resources";
import type { EvidenceJob } from "./admin-state-types";
import { adminData, adminPage, persistAdminData } from "./admin-store";

export const adminEvidenceState = {
  evidenceJobs(status?: EvidenceJob["status"]) {
    const state = adminData();
    return {
      items: state.evidenceJobs.filter((item) => !status || item.status === status),
      adminPage,
    };
  },
  retryEvidence(jobId: string) {
    const state = adminData();
    const job = state.evidenceJobs.find((item) => item.id === jobId && item.retryable);
    if (!job) return undefined;
    job.status = "RETRY_WAIT";
    job.retryable = true;
    job.errorCode = null;
    job.nextAttemptAt = mockNow();
    job.updatedAt = mockNow();
    persistAdminData();
    return structuredClone(job);
  },
  requestEvidence(resourceId: string) {
    const state = adminData();
    let job = state.evidenceJobs.find((item) => item.resourceId === resourceId);
    if (job) {
      if (job.retryable) {
        job.status = "RETRY_WAIT";
        job.errorCode = null;
        job.nextAttemptAt = mockNow();
        job.updatedAt = mockNow();
      }
      persistAdminData();
      return structuredClone(job);
    }
    const resource = resourceState.getGoverned(resourceId);
    if (!resource) return undefined;
    job = {
      id: crypto.randomUUID(),
      resourceId,
      versionId: resource.versionId,
      backend: "SIMULATOR",
      status: "PENDING",
      attemptCount: 0,
      retryable: true,
      errorCode: null,
      nextAttemptAt: mockNow(),
      createdAt: mockNow(),
      updatedAt: mockNow(),
    };
    state.evidenceJobs.unshift(job);
    persistAdminData();
    return structuredClone(job);
  },
  evidenceIntegrity() {
    const state = adminData();
    const totalRecords = evidenceState
      .ledgerBlocks()
      .reduce((total, block) => total + block.transactionCount, 0);
    return {
      status: "CONSISTENT" as const,
      totalJobs: state.evidenceJobs.length,
      totalRecords,
      orphanRecords: 0,
      mismatchedRecords: 0,
      checkedAt: mockNow(),
    };
  },
};

import type { components } from "@educhain/api-contract";

import { mockBeforeHours, mockNow } from "@/mocks/clock";
import { demoUser } from "@/mocks/fixtures/auth";
import { communityState } from "@/mocks/state/community";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type MaintenanceJob = components["schemas"]["MaintenanceJobResponse"];
type MaintenanceJobRequest = components["schemas"]["MaintenanceJobRequest"];

const storageKey = "educhain.mock.maintenance.v2";
const seedJobs: MaintenanceJob[] = [
  {
    id: "56000000-0000-4000-8000-000000000001",
    type: "SEARCH_REBUILD",
    status: "COMPLETED",
    requestedBy: demoUser.user.id,
    payloadSummary: "SEARCH_REBUILD",
    resultSummary: "DOCUMENTS_REBUILT:48",
    createdAt: mockBeforeHours(180),
    completedAt: mockBeforeHours(178),
  },
  {
    id: "56000000-0000-4000-8000-000000000002",
    type: "EXPIRED_DATA_CLEANUP",
    status: "COMPLETED",
    requestedBy: demoUser.user.id,
    payloadSummary: "EXPIRED_DATA_CLEANUP",
    resultSummary: "RECORDS_CLEANED:12",
    createdAt: mockBeforeHours(132),
    completedAt: mockBeforeHours(131),
  },
  {
    id: "56000000-0000-4000-8000-000000000003",
    type: "SYSTEM_ANNOUNCEMENT",
    status: "COMPLETED",
    requestedBy: demoUser.user.id,
    payloadSummary: "公开核验功能说明已更新",
    resultSummary: "RECIPIENTS_NOTIFIED:11",
    createdAt: mockBeforeHours(84),
    completedAt: mockBeforeHours(84),
  },
  {
    id: "56000000-0000-4000-8000-000000000004",
    type: "BACKUP_REQUEST",
    status: "ACCEPTED",
    requestedBy: demoUser.user.id,
    payloadSummary: "BACKUP_REQUEST",
    resultSummary: "OPERATOR_ACTION_REQUIRED",
    createdAt: mockBeforeHours(36),
    completedAt: null,
  },
];
let jobs: MaintenanceJob[] = structuredClone(seedJobs);
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  jobs = readMockSession<MaintenanceJob[]>(storageKey) ?? structuredClone(seedJobs);
}

function persist() {
  writeMockSession(storageKey, jobs);
}

export const maintenanceState = {
  list(limit = 30) {
    hydrate();
    return { items: structuredClone(jobs.slice(0, limit)) };
  },
  request(actorId: string, request: MaintenanceJobRequest) {
    hydrate();
    const createdAt = mockNow();
    const result = execute(request);
    const job: MaintenanceJob = {
      id: crypto.randomUUID(),
      type: request.type,
      status: request.type === "BACKUP_REQUEST" ? "ACCEPTED" : "COMPLETED",
      requestedBy: actorId,
      payloadSummary:
        request.type === "SYSTEM_ANNOUNCEMENT"
          ? request.announcementTitle?.trim() || request.type
          : request.type,
      resultSummary: result,
      createdAt,
      completedAt: request.type === "BACKUP_REQUEST" ? null : createdAt,
    };
    jobs.unshift(job);
    persist();
    return structuredClone(job);
  },
};

function execute(request: MaintenanceJobRequest) {
  if (request.type === "SEARCH_REBUILD") return "DOCUMENTS_REBUILT:48";
  if (request.type === "EXPIRED_DATA_CLEANUP") return "RECORDS_CLEANED:0";
  if (request.type === "BACKUP_REQUEST") return "OPERATOR_ACTION_REQUIRED";
  const recipients = communityState.broadcastSystemAnnouncement(
    request.announcementTitle?.trim() ?? "EduChain",
    request.announcementBody?.trim() ?? "",
  );
  return `RECIPIENTS_NOTIFIED:${recipients}`;
}

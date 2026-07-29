import { demoUser, mayaUser, mockUsers } from "@/mocks/fixtures/auth";
import { mockBeforeHours } from "@/mocks/clock";
import { mockPublishedResources } from "@/mocks/fixtures/resources";
import { mockCategories, mockTags } from "@/mocks/fixtures/taxonomy";
import type {
  AdminState,
  AuditEvent,
  EvidenceJob,
  PlatformSetting,
  Report,
} from "./admin-state-types";

const before = mockBeforeHours;

export const adminSeedState: AdminState = {
  resourceStatuses: {},
  reports: [
    {
      id: "51000000-0000-4000-8000-000000000001",
      reporterId: demoUser.user.id,
      targetType: "RESOURCE",
      targetId: "30000000-0000-4000-8000-000000000002",
      reason: "MISINFORMATION",
      details: "希望复核示例中的架构边界表述是否足够准确。",
      status: "OPEN",
      resolution: null,
      resolvedBy: null,
      createdAt: before(5),
      updatedAt: before(5),
    },
    {
      id: "51000000-0000-4000-8000-000000000002",
      reporterId: mayaUser.user.id,
      targetType: "COMMENT",
      targetId: "41000000-0000-4000-8000-000000000002",
      reason: "OTHER",
      details: "上下文完整，无需进一步治理。",
      status: "DISMISSED",
      resolution: "复核后确认内容符合讨论规范。",
      resolvedBy: demoUser.user.id,
      createdAt: before(30),
      updatedAt: before(20),
    },
    ...Array.from({ length: 8 }, (_, index): Report => {
      const status = (["OPEN", "RESOLVED", "DISMISSED"] as const)[index % 3];
      const targetType = index % 3 === 0 ? "COMMENT" : "RESOURCE";
      return {
        id: `51000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`,
        reporterId: mockUsers[(index + 2) % mockUsers.length].user.id,
        targetType,
        targetId:
          targetType === "RESOURCE"
            ? mockPublishedResources[index + 4].id
            : `41000000-0000-4000-8001-${String(index + 2).padStart(12, "0")}`,
        reason: (["SPAM", "COPYRIGHT", "MISINFORMATION", "UNSAFE_CONTENT", "OTHER"] as const)[
          index % 5
        ],
        details: "演示举报包含明确目标、问题类型、补充上下文和可复核的处理结果。",
        status,
        resolution: status === "OPEN" ? null : "管理员完成上下文复核，并记录对应的处理边界。",
        resolvedBy: status === "OPEN" ? null : demoUser.user.id,
        createdAt: before(44 + index * 27),
        updatedAt: before(18 + index * 13),
      };
    }),
  ],
  taxonomy: [
    ...mockCategories.map((item, index) => ({
      id: item.id,
      kind: "CATEGORY" as const,
      slug: item.slug,
      label: item.nameKey,
      description: item.descriptionKey,
      parentId: null,
      order: item.order,
      status: "ACTIVE" as const,
      mergedIntoId: null,
      version: 0,
      referenceCount: index < 3 ? 1 : 0,
    })),
    ...mockTags.map((item, index) => ({
      id: item.id,
      kind: "TAG" as const,
      slug: item.slug,
      label: item.name,
      description: "",
      parentId: null,
      order: null,
      status: "ACTIVE" as const,
      mergedIntoId: null,
      version: 0,
      referenceCount: index < 7 ? 1 : 0,
    })),
  ],
  evidenceJobs: [
    evidenceJob("52000000-0000-4000-8000-000000000001", 1, "COMPLETED", null),
    evidenceJob("52000000-0000-4000-8000-000000000002", 2, "ACCEPTED", null),
    evidenceJob(
      "52000000-0000-4000-8000-000000000003",
      3,
      "TERMINATED",
      "EVIDENCE_BACKEND_UNAVAILABLE",
    ),
    ...Array.from({ length: 13 }, (_, index) => {
      const statuses = [
        "COMPLETED",
        "CONFIRMED",
        "CERTIFICATE_PENDING",
        "RETRY_WAIT",
        "ACCEPTED",
      ] as const;
      const status = statuses[index % statuses.length];
      return evidenceJob(
        `52000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`,
        index + 4,
        status,
        status === "RETRY_WAIT" ? "EVIDENCE_CONFIRMATION_TIMEOUT" : null,
      );
    }),
  ],
  auditEvents: [
    {
      id: "53000000-0000-4000-8000-000000000001",
      actorId: demoUser.user.id,
      action: "REPORT_DISMISSED",
      targetType: "REPORT",
      targetId: "51000000-0000-4000-8000-000000000002",
      reason: "复核后确认内容符合讨论规范。",
      requestId: "mock-request-audit-0001",
      result: "SUCCEEDED",
      createdAt: before(20),
    },
    ...Array.from({ length: 11 }, (_, index): AuditEvent => ({
      id: `53000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`,
      actorId: index % 4 === 0 ? null : demoUser.user.id,
      action: [
        "RESOURCE_REVIEWED",
        "COMMENT_RESTORED",
        "REPORT_RESOLVED",
        "EVIDENCE_RETRY_SCHEDULED",
        "PLATFORM_SETTING_UPDATED",
      ][index % 5],
      targetType: ["RESOURCE", "COMMENT", "REPORT", "EVIDENCE_JOB", "PLATFORM_SETTING"][index % 5],
      targetId: mockPublishedResources[(index + 5) % mockPublishedResources.length].id,
      reason: "完成演示数据范围内的治理复核并保留操作原因。",
      requestId: `mock-request-audit-${String(index + 2).padStart(4, "0")}`,
      result: "SUCCEEDED",
      createdAt: before(32 + index * 23),
    })),
  ],
  settings: [
    platformSetting("site.display_name", "TEXT", "EduChain", true),
    platformSetting("content.default_license", "TEXT", "CC BY-NC 4.0", true),
    platformSetting("features.registrations_enabled", "BOOLEAN", "true", true),
    platformSetting("features.external_content_enabled", "BOOLEAN", "true", true),
    platformSetting("content.comments_enabled", "BOOLEAN", "true", true),
    platformSetting("operations.maintenance_notice", "TEXT", "", true),
  ],
  operationalAlerts: [
    {
      id: "59000000-0000-4000-8000-000000000001",
      severity: "WARNING",
      component: "evidence.retryable_jobs",
      summaryCode: "EVIDENCE_RETRYABLE_JOBS_HIGH",
      status: "OPEN",
      occurrenceCount: 3,
      firstSeenAt: before(26),
      lastSeenAt: before(2),
      resolvedAt: null,
      resolvedBy: null,
      resolutionReason: null,
      version: 0,
    },
    {
      id: "59000000-0000-4000-8000-000000000002",
      severity: "INFO",
      component: "search.index",
      summaryCode: "SEARCH_INDEX_RECOVERED",
      status: "RESOLVED",
      occurrenceCount: 1,
      firstSeenAt: before(72),
      lastSeenAt: before(70),
      resolvedAt: before(68),
      resolvedBy: demoUser.user.id,
      resolutionReason: "确认检索文档已完成重建且抽样结果正常。",
      version: 1,
    },
  ],
};

function platformSetting(
  key: string,
  type: PlatformSetting["type"],
  value: string,
  publicVisible: boolean,
): PlatformSetting {
  return { key, type, value, publicVisible, version: 0, updatedAt: before(240) };
}

function evidenceJob(
  id: string,
  suffix: number,
  status: EvidenceJob["status"],
  errorCode: string | null,
): EvidenceJob {
  const retryable = status === "TERMINATED" || status === "RETRY_WAIT";
  return {
    id,
    resourceId: `30000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`,
    versionId: `31000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`,
    backend: suffix === 3 ? "CHAINMAKER" : "SIMULATOR",
    status,
    attemptCount: status === "TERMINATED" ? 8 : status === "RETRY_WAIT" ? 3 : 1,
    retryable,
    errorCode,
    nextAttemptAt: status === "RETRY_WAIT" ? before(6 + suffix) : null,
    createdAt: before(48 - suffix),
    updatedAt: before(24 - suffix),
  };
}

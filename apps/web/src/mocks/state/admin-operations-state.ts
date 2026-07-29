import { mockNow, mockTrendDay } from "@/mocks/clock";
import { demoUser, mockUsers } from "@/mocks/fixtures/auth";
import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { evidenceState } from "@/mocks/state/evidence";
import { resourceState } from "@/mocks/state/resources";
import { adminData, adminPage, persistAdminData } from "./admin-store";

export const adminOperationsState = {
  audits(targetType?: string) {
    const state = adminData();
    return {
      items: state.auditEvents.filter((item) => !targetType || item.targetType === targetType),
      adminPage,
    };
  },
  audit(action: string, targetType: string, targetId: string, reason: string) {
    const state = adminData();
    state.auditEvents.unshift({
      id: crypto.randomUUID(),
      actorId: demoUser.user.id,
      action,
      targetType,
      targetId,
      reason,
      requestId: `mock-${crypto.randomUUID()}`,
      result: "SUCCEEDED",
      createdAt: mockNow(),
    });
    persistAdminData();
  },
  health() {
    return {
      status: "HEALTHY" as const,
      components: [
        { name: "java-server", status: "HEALTHY" as const, summaryCode: "SERVER_AVAILABLE" },
        { name: "database", status: "HEALTHY" as const, summaryCode: "DATABASE_AVAILABLE" },
        {
          name: "evidence-gateway",
          status: "HEALTHY" as const,
          summaryCode: "EVIDENCE_AVAILABLE",
        },
      ],
    };
  },
  operationalMetrics() {
    const state = adminData();
    const retryable = state.evidenceJobs.filter((item) => item.retryable).length;
    return {
      items: [
        { name: "jvm.heap.used", value: 42.6, unit: "percent", status: "HEALTHY" as const },
        { name: "storage.used", value: 61.8, unit: "percent", status: "HEALTHY" as const },
        {
          name: "system.load.per_processor",
          value: 0.34,
          unit: "ratio",
          status: "HEALTHY" as const,
        },
        {
          name: "evidence.retryable_jobs",
          value: retryable,
          unit: "count",
          status: retryable > 0 ? ("WARNING" as const) : ("HEALTHY" as const),
        },
      ],
      sampledAt: mockNow(),
    };
  },
  operationalEvents(limit: number) {
    const state = adminData();
    return {
      items: state.auditEvents.slice(0, limit).map((event) => ({
        id: event.id,
        category: event.action.split("_")[0],
        summaryCode: event.action,
        targetType: event.targetType,
        result: event.result,
        occurredAt: event.createdAt,
      })),
    };
  },
  operationalAlerts() {
    const state = adminData();
    return { items: structuredClone(state.operationalAlerts) };
  },
  resolveOperationalAlert(alertId: string, version: number, actorId: string, reason: string) {
    const state = adminData();
    const alert = state.operationalAlerts.find(
      (item) => item.id === alertId && item.version === version && item.status === "OPEN",
    );
    if (!alert) return undefined;
    alert.status = "RESOLVED";
    alert.resolvedAt = mockNow();
    alert.resolvedBy = actorId;
    alert.resolutionReason = reason;
    alert.version += 1;
    persistAdminData();
    return structuredClone(alert);
  },
  statistics() {
    const resources = resourceState.list();
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    const resourceTypes = new Map<string, number>();
    resources.forEach((resource) => {
      categories.set(resource.category.slug, (categories.get(resource.category.slug) ?? 0) + 1);
      resource.tags.forEach((tag) => tags.set(tag.slug, (tags.get(tag.slug) ?? 0) + 1));
      resourceTypes.set(resource.resourceType, (resourceTypes.get(resource.resourceType) ?? 0) + 1);
    });
    const community = communityState.platformMetrics();
    const evidenceBackends = new Map<string, number>();
    evidenceState.ledgerBlocks().forEach((block) => {
      evidenceBackends.set(
        block.backend,
        (evidenceBackends.get(block.backend) ?? 0) + block.transactionCount,
      );
    });
    return {
      users: authState.all().length,
      publishedResources: resources.length,
      comments: community.comments,
      likes: community.likes,
      views: mockUsers.length * 8,
      evidenceRecords: [...evidenceBackends.values()].reduce((total, count) => total + count, 0),
      categories: buckets(categories),
      tags: buckets(tags),
      resourceTypes: buckets(resourceTypes),
      evidenceBackends: buckets(evidenceBackends),
      trends: Array.from({ length: 14 }, (_, index) => {
        return {
          period: mockTrendDay(13 - index),
          registrations: index % 4 === 0 ? 1 : 0,
          publications: index % 3 === 0 ? 1 : 0,
          views: 2 + ((index * 3) % 7),
        };
      }),
    };
  },
  settings() {
    const state = adminData();
    return { items: structuredClone(state.settings) };
  },
  updateSetting(key: string, version: number, value: string) {
    const state = adminData();
    const setting = state.settings.find((item) => item.key === key && item.version === version);
    if (!setting) return undefined;
    setting.value = value.trim();
    setting.version += 1;
    setting.updatedAt = mockNow();
    persistAdminData();
    return structuredClone(setting);
  },
};

function buckets(values: Map<string, number>) {
  return [...values.entries()]
    .map(([key, count]) => ({ key, count }))
    .toSorted((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type UserStatus = components["schemas"]["UserStatus"];
type ResourceStatus = components["schemas"]["ResourceStatus"];
type CommentStatus = components["schemas"]["CommentStatus"];
type ReportStatus = components["schemas"]["ReportStatus"];
type EvidenceJobStatus = components["schemas"]["EvidenceJobStatus"];

export const getAdminOverview = async () => unwrapApiResult(await apiClient.GET("/admin/overview"));

export const getAdminUsers = async (options: { query?: string; status?: UserStatus } = {}) =>
  unwrapApiResult(
    await apiClient.GET("/admin/users", { params: { query: { ...options, limit: 50 } } }),
  );

export const getAdminResources = async (status?: ResourceStatus) =>
  unwrapApiResult(
    await apiClient.GET("/admin/resources", { params: { query: { status, limit: 50 } } }),
  );

export const getAdminComments = async (status?: CommentStatus) =>
  unwrapApiResult(
    await apiClient.GET("/admin/comments", { params: { query: { status, limit: 50 } } }),
  );

export const getAdminReports = async (status?: ReportStatus) =>
  unwrapApiResult(
    await apiClient.GET("/admin/reports", { params: { query: { status, limit: 50 } } }),
  );

export const getAdminTaxonomy = async () => unwrapApiResult(await apiClient.GET("/admin/taxonomy"));

export const getAdminEvidenceJobs = async (status?: EvidenceJobStatus) =>
  unwrapApiResult(
    await apiClient.GET("/admin/evidence-jobs", { params: { query: { status, limit: 50 } } }),
  );

export const getAdminAuditEvents = async (targetType?: string) =>
  unwrapApiResult(
    await apiClient.GET("/admin/audit-events", {
      params: { query: { targetType, limit: 50 } },
    }),
  );

export const getAdminSystemHealth = async () =>
  unwrapApiResult(await apiClient.GET("/admin/system-health"));

export const getAdminEvidenceIntegrity = async () =>
  unwrapApiResult(await apiClient.GET("/admin/evidence-integrity"));

export const getAdminOperationalMetrics = async () =>
  unwrapApiResult(await apiClient.GET("/admin/operational-metrics"));

export const getAdminOperationalEvents = async (limit = 20) =>
  unwrapApiResult(
    await apiClient.GET("/admin/operational-events", { params: { query: { limit } } }),
  );

export const getAdminOperationalAlerts = async () =>
  unwrapApiResult(await apiClient.GET("/admin/operational-alerts"));

export const getAdminStatistics = async () =>
  unwrapApiResult(await apiClient.GET("/admin/statistics"));

export const getAdminPlatformSettings = async () =>
  unwrapApiResult(await apiClient.GET("/admin/settings"));

export const getAdminMaintenanceJobs = async () =>
  unwrapApiResult(
    await apiClient.GET("/admin/maintenance-jobs", { params: { query: { limit: 30 } } }),
  );

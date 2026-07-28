import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { ensureApiSuccess, unwrapApiResult } from "@/data-access/http/result";

type UserStatus = components["schemas"]["UserStatus"];
type ReportStatus = "RESOLVED" | "DISMISSED";
type TaxonomyStatus = "ACTIVE" | "DISABLED";
type CreateReportRequest = components["schemas"]["CreateReportRequest"];
type CategoryWriteRequest = components["schemas"]["AdminCategoryWriteRequest"];
type TagWriteRequest = components["schemas"]["AdminTagWriteRequest"];
type MaintenanceJobRequest = components["schemas"]["MaintenanceJobRequest"];
type UserCreateRequest = components["schemas"]["AdminUserCreateRequest"];
type UserUpdateRequest = components["schemas"]["AdminUserUpdateRequest"];
type ResourceReviewDecision = components["schemas"]["AdminResourceReviewBatchRequest"]["decision"];
type TaxonomyDeletionRef = components["schemas"]["AdminTaxonomyDeletionRef"];

const writeHeaders = async () => ({ "X-XSRF-TOKEN": await getCsrfToken() });

export async function createReport(body: CreateReportRequest) {
  return unwrapApiResult(await apiClient.POST("/reports", { body, headers: await writeHeaders() }));
}

export async function updateAdminUserStatus(
  userId: string,
  version: number,
  status: UserStatus,
  reason: string,
) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/users/{userId}/status", {
      body: { status, reason },
      params: { path: { userId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function createAdminUser(body: UserCreateRequest) {
  return unwrapApiResult(
    await apiClient.POST("/admin/users", { body, headers: await writeHeaders() }),
  );
}

export async function updateAdminUser(userId: string, version: number, body: UserUpdateRequest) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/users/{userId}", {
      body,
      params: { path: { userId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function deleteAdminUser(userId: string, version: number, reason: string) {
  const result = await apiClient.DELETE("/admin/users/{userId}", {
    body: { reason },
    params: { path: { userId }, header: { "If-Match": `"${version}"` } },
    headers: await writeHeaders(),
  });
  ensureApiSuccess(result);
}

export async function deleteAdminUsers(userIds: string[], reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/user-deletion-batches", {
      body: { userIds, reason },
      headers: await writeHeaders(),
    }),
  );
}

export async function requestAdminPasswordReset(userId: string, reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/users/{userId}/password-reset-requests", {
      body: { reason },
      params: { path: { userId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function setAdminResourceWithdrawn(
  resourceId: string,
  withdrawn: boolean,
  reason: string,
) {
  const headers = await writeHeaders();
  return withdrawn
    ? unwrapApiResult(
        await apiClient.POST("/admin/resources/{resourceId}/withdrawals", {
          body: { reason },
          params: { path: { resourceId } },
          headers,
        }),
      )
    : unwrapApiResult(
        await apiClient.POST("/admin/resources/{resourceId}/restorations", {
          body: { reason },
          params: { path: { resourceId } },
          headers,
        }),
      );
}

export async function reviewAdminResources(
  resourceIds: string[],
  decision: ResourceReviewDecision,
  reason: string,
) {
  return unwrapApiResult(
    await apiClient.POST("/admin/resource-review-batches", {
      body: { resourceIds, decision, reason },
      headers: await writeHeaders(),
    }),
  );
}

export async function exportAdminUsers(reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/user-exports", {
      body: { reason },
      headers: await writeHeaders(),
      parseAs: "text",
    }),
  );
}

export async function exportAdminResources(reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/resource-exports", {
      body: { reason },
      headers: await writeHeaders(),
      parseAs: "text",
    }),
  );
}

export async function setAdminCommentHidden(commentId: string, hidden: boolean, reason: string) {
  const headers = await writeHeaders();
  return hidden
    ? unwrapApiResult(
        await apiClient.POST("/admin/comments/{commentId}/hiding", {
          body: { reason },
          params: { path: { commentId } },
          headers,
        }),
      )
    : unwrapApiResult(
        await apiClient.POST("/admin/comments/{commentId}/restorations", {
          body: { reason },
          params: { path: { commentId } },
          headers,
        }),
      );
}

export async function resolveAdminReport(reportId: string, status: ReportStatus, reason: string) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/reports/{reportId}/resolution", {
      body: { status, reason },
      params: { path: { reportId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function updateAdminTaxonomyStatus(
  item: { id: string; kind: "CATEGORY" | "TAG"; version: number },
  status: TaxonomyStatus,
  reason: string,
) {
  const common = {
    body: { status, reason },
    params: { path: {}, header: { "If-Match": `"${item.version}"` } },
    headers: await writeHeaders(),
  };
  return item.kind === "CATEGORY"
    ? unwrapApiResult(
        await apiClient.PUT("/admin/categories/{categoryId}/status", {
          ...common,
          params: { ...common.params, path: { categoryId: item.id } },
        }),
      )
    : unwrapApiResult(
        await apiClient.PUT("/admin/tags/{tagId}/status", {
          ...common,
          params: { ...common.params, path: { tagId: item.id } },
        }),
      );
}

export async function mergeAdminTaxonomy(
  item: { id: string; kind: "CATEGORY" | "TAG"; version: number },
  targetId: string,
  reason: string,
) {
  const common = {
    body: { targetId, reason },
    params: { path: {}, header: { "If-Match": `"${item.version}"` } },
    headers: await writeHeaders(),
  };
  return item.kind === "CATEGORY"
    ? unwrapApiResult(
        await apiClient.POST("/admin/categories/{categoryId}/merges", {
          ...common,
          params: { ...common.params, path: { categoryId: item.id } },
        }),
      )
    : unwrapApiResult(
        await apiClient.POST("/admin/tags/{tagId}/merges", {
          ...common,
          params: { ...common.params, path: { tagId: item.id } },
        }),
      );
}

export async function createAdminCategory(body: CategoryWriteRequest) {
  return unwrapApiResult(
    await apiClient.POST("/admin/categories", { body, headers: await writeHeaders() }),
  );
}

export async function updateAdminCategory(
  categoryId: string,
  version: number,
  body: CategoryWriteRequest,
) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/categories/{categoryId}", {
      body,
      params: { path: { categoryId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function createAdminTag(body: TagWriteRequest) {
  return unwrapApiResult(
    await apiClient.POST("/admin/tags", { body, headers: await writeHeaders() }),
  );
}

export async function updateAdminTag(tagId: string, version: number, body: TagWriteRequest) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/tags/{tagId}", {
      body,
      params: { path: { tagId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function deleteAdminTaxonomyItem(
  item: TaxonomyDeletionRef,
  reason: string,
): Promise<void> {
  const headers = await writeHeaders();
  const common = {
    body: { reason },
    params: { path: {}, header: { "If-Match": `"${item.version}"` } },
    headers,
  };
  const result =
    item.kind === "CATEGORY"
      ? await apiClient.DELETE("/admin/categories/{categoryId}", {
          ...common,
          params: { ...common.params, path: { categoryId: item.id } },
        })
      : await apiClient.DELETE("/admin/tags/{tagId}", {
          ...common,
          params: { ...common.params, path: { tagId: item.id } },
        });
  ensureApiSuccess(result);
}

export async function deleteAdminTaxonomyItems(items: TaxonomyDeletionRef[], reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/taxonomy-deletion-batches", {
      body: { items, reason },
      headers: await writeHeaders(),
    }),
  );
}

export async function retryAdminEvidenceJob(jobId: string, reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/evidence-jobs/{jobId}/retries", {
      body: { reason },
      params: { path: { jobId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function requestAdminEvidence(resourceId: string, reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/resources/{resourceId}/evidence-requests", {
      body: { reason },
      params: { path: { resourceId } },
      headers: await writeHeaders(),
    }),
  );
}

export async function resolveAdminOperationalAlert(
  alertId: string,
  version: number,
  reason: string,
) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/operational-alerts/{alertId}/resolution", {
      body: { reason },
      params: { path: { alertId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function updateAdminPlatformSetting(
  settingKey: string,
  version: number,
  value: string,
  reason: string,
) {
  return unwrapApiResult(
    await apiClient.PUT("/admin/settings/{settingKey}", {
      body: { value, reason },
      params: { path: { settingKey }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );
}

export async function exportAdminStatistics(reason: string) {
  return unwrapApiResult(
    await apiClient.POST("/admin/statistics/exports", {
      body: { reason },
      headers: await writeHeaders(),
      parseAs: "text",
    }),
  );
}

export async function requestAdminMaintenanceJob(body: MaintenanceJobRequest) {
  return unwrapApiResult(
    await apiClient.POST("/admin/maintenance-jobs", {
      body,
      headers: await writeHeaders(),
    }),
  );
}

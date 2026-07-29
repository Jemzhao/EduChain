import type { components } from "@educhain/api-contract";

export type AdminUser = components["schemas"]["AdminUserResponse"];
export type AdminResource = components["schemas"]["AdminResourceResponse"];
export type AdminComment = components["schemas"]["AdminCommentResponse"];
export type Report = components["schemas"]["ReportResponse"];
export type ReportStatus = components["schemas"]["ReportStatus"];
export type TaxonomyItem = components["schemas"]["AdminTaxonomyItem"];
export type EvidenceJob = components["schemas"]["EvidenceJobResponse"];
export type AuditEvent = components["schemas"]["AuditEventResponse"];
export type UserStatus = components["schemas"]["UserStatus"];
export type ResourceStatus = components["schemas"]["ResourceStatus"];
export type CategoryWrite = components["schemas"]["AdminCategoryWriteRequest"];
export type TagWrite = components["schemas"]["AdminTagWriteRequest"];
export type PlatformSetting = components["schemas"]["PlatformSettingResponse"];
export type OperationalAlert = components["schemas"]["AdminOperationalAlertResponse"];
export type UserCreate = components["schemas"]["AdminUserCreateRequest"];
export type UserUpdate = components["schemas"]["AdminUserUpdateRequest"];

export type AdminState = {
  resourceStatuses: Record<string, ResourceStatus>;
  reports: Report[];
  taxonomy: TaxonomyItem[];
  evidenceJobs: EvidenceJob[];
  auditEvents: AuditEvent[];
  settings: PlatformSetting[];
  operationalAlerts: OperationalAlert[];
};

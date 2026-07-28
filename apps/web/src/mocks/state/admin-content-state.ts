import { mockNow } from "@/mocks/clock";
import { demoUser } from "@/mocks/fixtures/auth";
import { communityState } from "@/mocks/state/community";
import { resourceState } from "@/mocks/state/resources";
import type {
  AdminResource,
  AdminComment,
  Report,
  ReportStatus,
  ResourceStatus,
} from "./admin-state-types";
import { adminData, adminPage, persistAdminData } from "./admin-store";

export const adminContentState = {
  resources(status?: ResourceStatus) {
    const state = adminData();
    const items = resourceState
      .listGoverned()
      .map((resource): AdminResource => ({
        id: resource.id,
        slug: resource.slug,
        title: resource.title,
        author: resource.author,
        status:
          state.resourceStatuses[resource.id] ?? resourceState.status(resource.id) ?? "PUBLISHED",
        version: resource.versionNumber,
        evidenceStatus: resource.evidenceStatus,
        publishedAt: resource.publishedAt,
      }))
      .filter((item) => !status || item.status === status);
    return { items, adminPage };
  },
  setResourceStatus(resourceId: string, status: ResourceStatus) {
    const state = adminData();
    const resource = resourceState.getGoverned(resourceId);
    if (!resource) return undefined;
    state.resourceStatuses[resourceId] = status;
    resourceState.setStatus(resourceId, status === "WITHDRAWN" ? "WITHDRAWN" : "PUBLISHED");
    communityState.notifyResourceStatus(resource.author.id, demoUser.user.id, resourceId);
    persistAdminData();
    return this.resources().items.find((item) => item.id === resourceId);
  },
  reviewResources(resourceIds: string[], decision: "APPROVE" | "REJECT") {
    let processedCount = 0;
    resourceIds.forEach((resourceId) => {
      if (this.setResourceStatus(resourceId, decision === "APPROVE" ? "PUBLISHED" : "WITHDRAWN")) {
        processedCount += 1;
      }
    });
    return { processedCount };
  },
  comments(status?: AdminComment["status"]) {
    const items = communityState
      .governanceComments()
      .map((comment): AdminComment => ({
        id: comment.id,
        resourceId: comment.resourceId,
        resourceTitle: resourceState.getGoverned(comment.resourceId)?.title ?? "—",
        author: comment.author,
        body: comment.body,
        status: comment.status,
        version: 0,
        createdAt: comment.createdAt,
      }))
      .filter((item) => !status || item.status === status);
    return { items, adminPage };
  },
  setCommentHidden(commentId: string, hidden: boolean) {
    const comment = hidden
      ? communityState.hideComment(commentId)
      : communityState.restoreComment(commentId);
    return comment ? this.comments().items.find((item) => item.id === commentId) : undefined;
  },
  reports(status?: ReportStatus) {
    const state = adminData();
    return { items: state.reports.filter((item) => !status || item.status === status), adminPage };
  },
  createReport(report: Report) {
    const state = adminData();
    state.reports.unshift(report);
    persistAdminData();
    return structuredClone(report);
  },
  resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED", reason: string) {
    const state = adminData();
    const report = state.reports.find((item) => item.id === reportId && item.status === "OPEN");
    if (!report) return undefined;
    report.status = status;
    report.resolution = reason;
    report.resolvedBy = demoUser.user.id;
    report.updatedAt = mockNow();
    persistAdminData();
    return structuredClone(report);
  },
};

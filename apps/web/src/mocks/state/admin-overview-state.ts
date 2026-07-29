import { authState } from "@/mocks/state/auth";
import { communityState } from "@/mocks/state/community";
import { adminData } from "./admin-store";

export const adminOverviewState = {
  overview() {
    const state = adminData();
    return {
      openReports: state.reports.filter((item) => item.status === "OPEN").length,
      restrictedUsers: authState.all().filter((item) => item.user.status !== "ACTIVE").length,
      withdrawnResources: Object.values(state.resourceStatuses).filter(
        (status) => status === "WITHDRAWN",
      ).length,
      hiddenComments: communityState.governanceComments().filter((item) => item.status === "HIDDEN")
        .length,
      retryableEvidenceJobs: state.evidenceJobs.filter((item) => item.retryable).length,
      health: "HEALTHY" as const,
    };
  },
};

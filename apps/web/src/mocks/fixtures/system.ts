import type { components } from "@educhain/api-contract";

export const availableService: components["schemas"]["HealthResponse"] = {
  status: "available",
  service: "educhain-server",
};

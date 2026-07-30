import { adminHandlers } from "./admin";
import { authHandlers, userHandlers } from "./auth";
import { interactionHandlers, notificationHandlers, socialHandlers } from "./community";
import { communityDiscoveryHandlers } from "./community-discovery";
import { evidenceHandlers } from "./evidence";
import { externalContentHandlers } from "./external-content";
import { discoveryHandlers } from "./discovery";
import { fileHandlers, resourceHandlers, searchHandlers, taxonomyHandlers } from "./resources";
import { maintenanceHandlers } from "./maintenance";
import { systemHandlers } from "./system";
import { supportHandlers } from "./support";

export const handlers = [
  ...systemHandlers,
  ...adminHandlers,
  ...maintenanceHandlers,
  ...authHandlers,
  ...userHandlers,
  ...taxonomyHandlers,
  ...resourceHandlers,
  ...discoveryHandlers,
  ...evidenceHandlers,
  ...externalContentHandlers,
  ...interactionHandlers,
  ...socialHandlers,
  ...notificationHandlers,
  ...communityDiscoveryHandlers,
  ...supportHandlers,
  ...fileHandlers,
  ...searchHandlers,
];

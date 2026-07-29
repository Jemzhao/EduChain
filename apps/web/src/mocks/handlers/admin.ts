import { adminContentHandlers } from "./admin-content";
import { adminOperationsHandlers } from "./admin-operations";
import { adminPlatformHandlers } from "./admin-platform";
import { adminReportHandlers } from "./admin-report";
import { adminTaxonomyHandlers } from "./admin-taxonomy";

export const adminHandlers = [
  ...adminReportHandlers,
  ...adminPlatformHandlers,
  ...adminContentHandlers,
  ...adminTaxonomyHandlers,
  ...adminOperationsHandlers,
];

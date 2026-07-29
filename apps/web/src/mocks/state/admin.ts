import { adminContentState } from "./admin-content-state";
import { adminEvidenceState } from "./admin-evidence-state";
import { adminOperationsState } from "./admin-operations-state";
import { adminOverviewState } from "./admin-overview-state";
import { adminTaxonomyState } from "./admin-taxonomy-state";
import { adminUserState } from "./admin-user-state";

export const adminState = {
  ...adminOverviewState,
  ...adminUserState,
  ...adminContentState,
  ...adminTaxonomyState,
  ...adminEvidenceState,
  ...adminOperationsState,
};

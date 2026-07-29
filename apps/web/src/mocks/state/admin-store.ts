import { adminSeedState } from "./admin-seed";
import type { AdminState } from "./admin-state-types";
import { readMockSession, writeMockSession } from "./session-storage";

const storageKey = "educhain.mock.admin.v2";
let state = structuredClone(adminSeedState);
let hydrated = false;

export const adminPage = { nextCursor: null, hasMore: false };

export function adminData(): AdminState {
  if (!hydrated) {
    hydrated = true;
    state = readMockSession<AdminState>(storageKey) ?? structuredClone(adminSeedState);
    state.settings ??= structuredClone(adminSeedState.settings);
    state.operationalAlerts ??= structuredClone(adminSeedState.operationalAlerts);
    state.taxonomy.forEach((item) => (item.mergedIntoId ??= null));
  }
  return state;
}

export function persistAdminData(): void {
  writeMockSession(storageKey, state);
}

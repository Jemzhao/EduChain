import { communitySeedState } from "./community-seed";
import type { CommunityState } from "./community-state-types";
import { readMockSession, writeMockSession } from "./session-storage";

const storageKey = "educhain.mock.community.v2";
let state = structuredClone(communitySeedState);
let hydrated = false;

export function communityData(): CommunityState {
  if (!hydrated) {
    hydrated = true;
    state = readMockSession<CommunityState>(storageKey) ?? structuredClone(communitySeedState);
  }
  return state;
}

export function persistCommunityData(): void {
  writeMockSession(storageKey, state);
}

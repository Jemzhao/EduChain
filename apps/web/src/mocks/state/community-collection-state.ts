import { mockNow } from "@/mocks/clock";
import { createCommunityCollection } from "./community-factories";
import { collectionResponse, ensureDefault, ownedCollection } from "./community-helpers";
import { communityData, persistCommunityData } from "./community-store";

export const communityCollectionState = {
  collections(ownerId: string, resourceId?: string) {
    const state = communityData();
    ensureDefault(ownerId);
    return state.collections
      .filter((item) => state.collectionOwners[item.id] === ownerId)
      .map((item) => collectionResponse(item, resourceId));
  },
  createCollection(ownerId: string, name: string) {
    const state = communityData();
    const timestamp = mockNow();
    const item = createCommunityCollection(
      crypto.randomUUID(),
      name.trim(),
      false,
      0,
      timestamp,
      timestamp,
    );
    state.collections.push(item);
    state.collectionOwners[item.id] = ownerId;
    persistCommunityData();
    return collectionResponse(item);
  },
  updateCollection(ownerId: string, collectionId: string, name: string, version: number) {
    const item = ownedCollection(ownerId, collectionId);
    if (!item || item.version !== version) return undefined;
    item.name = name.trim();
    item.version += 1;
    item.updatedAt = mockNow();
    persistCommunityData();
    return collectionResponse(item);
  },
  deleteCollection(ownerId: string, collectionId: string) {
    const state = communityData();
    const item = ownedCollection(ownerId, collectionId);
    if (!item || item.defaultCollection) return false;
    state.collections = state.collections.filter((collection) => collection.id !== collectionId);
    state.collectionItems = state.collectionItems.filter(
      (entry) => entry.collectionId !== collectionId,
    );
    delete state.collectionOwners[collectionId];
    persistCommunityData();
    return true;
  },
  collection(ownerId: string, collectionId: string) {
    const item = ownedCollection(ownerId, collectionId);
    return item ? collectionResponse(item) : undefined;
  },
  collectionItems(ownerId: string, collectionId: string) {
    const state = communityData();
    if (!ownedCollection(ownerId, collectionId)) return undefined;
    return state.collectionItems
      .filter((item) => item.collectionId === collectionId)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  },
  addCollectionItem(ownerId: string, collectionId: string, resourceId: string) {
    const state = communityData();
    if (!ownedCollection(ownerId, collectionId)) return undefined;
    let item = state.collectionItems.find(
      (entry) => entry.collectionId === collectionId && entry.resourceId === resourceId,
    );
    if (!item) {
      item = { collectionId, resourceId, savedAt: mockNow() };
      state.collectionItems.push(item);
      persistCommunityData();
    }
    return structuredClone(item);
  },
  removeCollectionItem(ownerId: string, collectionId: string, resourceId: string) {
    const state = communityData();
    if (!ownedCollection(ownerId, collectionId)) return false;
    state.collectionItems = state.collectionItems.filter(
      (item) => !(item.collectionId === collectionId && item.resourceId === resourceId),
    );
    persistCommunityData();
    return true;
  },
};

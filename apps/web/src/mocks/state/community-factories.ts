import type { Collection, StoredComment } from "./community-state-types";

export function createCommunityCollection(
  id: string,
  name: string,
  defaultCollection: boolean,
  itemCount: number,
  createdAt: string,
  updatedAt: string,
): Collection {
  return {
    id,
    name,
    defaultCollection,
    itemCount,
    containsResource: false,
    version: 0,
    createdAt,
    updatedAt,
  };
}

export function createStoredComment(
  id: string,
  authorId: string,
  parentCommentId: string | null,
  rootCommentId: string,
  body: string,
  createdAt: string,
  resourceId = "30000000-0000-4000-8000-000000000001",
): StoredComment {
  return {
    id,
    resourceId,
    authorId,
    parentCommentId,
    rootCommentId,
    body,
    status: "VISIBLE",
    createdAt,
    updatedAt: createdAt,
  };
}

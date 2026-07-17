import { mockNow } from "@/mocks/clock";
import { createStoredComment } from "./community-factories";
import { addNotification, commentResponse, authorFor } from "./community-helpers";
import { communityData, persistCommunityData } from "./community-store";

export const communityCommentState = {
  comments(resourceId: string, viewerId?: string) {
    const state = communityData();
    const roots = state.comments
      .filter((comment) => comment.resourceId === resourceId && !comment.parentCommentId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return roots.map((root) => {
      const replies = state.comments
        .filter((comment) => comment.rootCommentId === root.id && comment.parentCommentId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      return {
        comment: commentResponse(root, viewerId, replies.length),
        replies: replies.map((reply) => commentResponse(reply, viewerId, 0)),
      };
    });
  },
  createComment(
    userId: string,
    resourceId: string,
    resourceAuthorId: string,
    body: string,
    parentCommentId?: string | null,
  ) {
    const state = communityData();
    const parent = parentCommentId
      ? state.comments.find((comment) => comment.id === parentCommentId)
      : undefined;
    if (
      parentCommentId &&
      (!parent || parent.parentCommentId || parent.resourceId !== resourceId)
    ) {
      return undefined;
    }
    const id = crypto.randomUUID();
    const comment = createStoredComment(
      id,
      userId,
      parent?.id ?? null,
      parent?.rootCommentId ?? id,
      body.trim(),
      mockNow(),
      resourceId,
    );
    state.comments.push(comment);
    if (parent && parent.authorId !== userId) {
      addNotification(parent.authorId, {
        id: crypto.randomUUID(),
        type: "COMMENT_REPLY",
        actor: authorFor(userId),
        resourceId,
        commentId: id,
        systemTitle: null,
        systemBody: null,
        read: false,
        createdAt: comment.createdAt,
      });
    }
    if ((!parent || parent.authorId !== resourceAuthorId) && resourceAuthorId !== userId) {
      addNotification(resourceAuthorId, {
        id: crypto.randomUUID(),
        type: "RESOURCE_COMMENT",
        actor: authorFor(userId),
        resourceId,
        commentId: id,
        systemTitle: null,
        systemBody: null,
        read: false,
        createdAt: comment.createdAt,
      });
    }
    persistCommunityData();
    return commentResponse(comment, userId, 0);
  },
  deleteComment(userId: string, commentId: string) {
    const state = communityData();
    const comment = state.comments.find(
      (item) => item.id === commentId && item.authorId === userId,
    );
    if (!comment) return undefined;
    comment.body = null;
    comment.status = "DELETED";
    comment.updatedAt = mockNow();
    persistCommunityData();
    const replies = state.comments.filter(
      (item) => item.rootCommentId === comment.id && item.parentCommentId,
    ).length;
    return commentResponse(comment, userId, replies);
  },
  governanceComments() {
    const state = communityData();
    return state.comments
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((comment) => commentResponse(comment));
  },
  hideComment(commentId: string) {
    const state = communityData();
    const comment = state.comments.find((item) => item.id === commentId);
    if (!comment || comment.status !== "VISIBLE") return undefined;
    comment.moderationBody = comment.body ?? undefined;
    comment.body = null;
    comment.status = "HIDDEN";
    comment.updatedAt = mockNow();
    persistCommunityData();
    return commentResponse(comment);
  },
  restoreComment(commentId: string) {
    const state = communityData();
    const comment = state.comments.find((item) => item.id === commentId);
    if (!comment || comment.status !== "HIDDEN" || !comment.moderationBody) return undefined;
    comment.body = comment.moderationBody;
    delete comment.moderationBody;
    comment.status = "VISIBLE";
    comment.updatedAt = mockNow();
    persistCommunityData();
    return commentResponse(comment);
  },
};

import { communityData, persistCommunityData } from "./community-store";

export const communityReactionState = {
  statistics(resourceId: string) {
    const state = communityData();
    return {
      likes: state.likes.filter((like) => like.resourceId === resourceId).length,
      saves: state.collectionItems.filter((item) => item.resourceId === resourceId).length,
      comments: state.comments.filter(
        (comment) => comment.resourceId === resourceId && comment.status === "VISIBLE",
      ).length,
    };
  },
  like(userId: string, resourceId: string) {
    const state = communityData();
    const liked = state.likes.some(
      (like) => like.userId === userId && like.resourceId === resourceId,
    );
    return {
      resourceId,
      liked,
      likeCount: state.likes.filter((like) => like.resourceId === resourceId).length,
    };
  },
  setLike(userId: string, resourceId: string, liked: boolean) {
    const state = communityData();
    state.likes = state.likes.filter(
      (like) => !(like.userId === userId && like.resourceId === resourceId),
    );
    if (liked) state.likes.push({ userId, resourceId });
    persistCommunityData();
    return this.like(userId, resourceId);
  },
};

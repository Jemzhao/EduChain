import { mockNow } from "@/mocks/clock";
import { addNotification, authorFor } from "./community-helpers";
import { communityData, persistCommunityData } from "./community-store";

export const communitySocialState = {
  follow(followerId: string, followedId: string) {
    const state = communityData();
    return {
      userId: followedId,
      following: state.follows.some(
        (follow) => follow.followerId === followerId && follow.followedId === followedId,
      ),
      followerCount: state.follows.filter((follow) => follow.followedId === followedId).length,
      followingCount: state.follows.filter((follow) => follow.followerId === followedId).length,
    };
  },
  setFollow(followerId: string, followedId: string, following: boolean) {
    const state = communityData();
    state.follows = state.follows.filter(
      (follow) => !(follow.followerId === followerId && follow.followedId === followedId),
    );
    if (following) {
      state.follows.push({ followerId, followedId, createdAt: mockNow() });
      addNotification(followedId, {
        id: crypto.randomUUID(),
        type: "NEW_FOLLOWER",
        actor: authorFor(followerId),
        systemTitle: null,
        systemBody: null,
        read: false,
        createdAt: mockNow(),
      });
    }
    persistCommunityData();
    return this.follow(followerId, followedId);
  },
  notifyResourceLiked(recipientId: string, actorId: string, resourceId: string) {
    if (recipientId === actorId) return;
    addNotification(recipientId, {
      id: crypto.randomUUID(),
      type: "RESOURCE_LIKED",
      actor: authorFor(actorId),
      resourceId,
      systemTitle: null,
      systemBody: null,
      read: false,
      createdAt: mockNow(),
    });
    persistCommunityData();
  },
  notifyFollowersPublished(authorId: string, resourceId: string) {
    const state = communityData();
    for (const follow of state.follows.filter((item) => item.followedId === authorId)) {
      addNotification(follow.followerId, {
        id: crypto.randomUUID(),
        type: "FOLLOWED_AUTHOR_PUBLISHED",
        actor: authorFor(authorId),
        resourceId,
        systemTitle: null,
        systemBody: null,
        read: false,
        createdAt: mockNow(),
      });
    }
    persistCommunityData();
  },
  notifyResourceStatus(recipientId: string, actorId: string, resourceId: string) {
    if (recipientId === actorId) return;
    addNotification(recipientId, {
      id: crypto.randomUUID(),
      type: "RESOURCE_STATUS",
      actor: authorFor(actorId),
      resourceId,
      systemTitle: null,
      systemBody: null,
      read: false,
      createdAt: mockNow(),
    });
    persistCommunityData();
  },
  followCounts(userId: string) {
    const state = communityData();
    return {
      followers: state.follows.filter((follow) => follow.followedId === userId).length,
      following: state.follows.filter((follow) => follow.followerId === userId).length,
    };
  },
  platformMetrics() {
    const state = communityData();
    return {
      likes: state.likes.length,
      comments: state.comments.filter((comment) => comment.status === "VISIBLE").length,
      follows: state.follows.length,
    };
  },
  contributionMetrics(userId: string, authoredResourceIds: string[]) {
    const state = communityData();
    const authored = new Set(authoredResourceIds);
    return {
      comments: state.comments.filter(
        (comment) => comment.authorId === userId && comment.status === "VISIBLE",
      ).length,
      receivedLikes: state.likes.filter((like) => authored.has(like.resourceId)).length,
      followers: state.follows.filter((follow) => follow.followedId === userId).length,
    };
  },
  followers(userId: string) {
    const state = communityData();
    return state.follows
      .filter((follow) => follow.followedId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((follow) => authorFor(follow.followerId));
  },
  following(userId: string) {
    const state = communityData();
    return state.follows
      .filter((follow) => follow.followerId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((follow) => authorFor(follow.followedId));
  },
};

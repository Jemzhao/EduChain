import { communityCollectionState } from "./community-collection-state";
import { communityCommentState } from "./community-comment-state";
import { communityNotificationState } from "./community-notification-state";
import { communityReactionState } from "./community-reaction-state";
import { communitySocialState } from "./community-social-state";

export const communityState = {
  ...communityReactionState,
  ...communityCollectionState,
  ...communityCommentState,
  ...communitySocialState,
  ...communityNotificationState,
};

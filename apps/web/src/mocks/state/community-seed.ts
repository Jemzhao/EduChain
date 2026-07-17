import { demoUser, mayaUser, mockUsers } from "@/mocks/fixtures/auth";
import { mockBeforeHours } from "@/mocks/clock";
import { mockPublishedResources } from "@/mocks/fixtures/resources";
import { createCommunityCollection, createStoredComment } from "./community-factories";
import type { Notification, StoredComment, Follow, CommunityState } from "./community-state-types";

const isoBefore = mockBeforeHours;

const defaultCollectionId = "40000000-0000-4000-8000-000000000001";
const readingCollectionId = "40000000-0000-4000-8000-000000000002";
const mayaDefaultCollectionId = "40000000-0000-4000-8000-000000000003";
const rootCommentId = "41000000-0000-4000-8000-000000000001";
const demoCommentId = "41000000-0000-4000-8000-000000000002";
const replyCommentId = "41000000-0000-4000-8000-000000000003";

const generatedLikes = mockUsers.flatMap((user, userIndex) =>
  mockPublishedResources
    .filter((_, resourceIndex) => (resourceIndex + userIndex * 2) % 5 === 0)
    .map((resource) => ({ userId: user.user.id, resourceId: resource.id })),
);

const generatedComments: StoredComment[] = mockPublishedResources
  .slice(3, 36)
  .map((resource, index) => {
    const id = `41000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`;
    const authorId = mockUsers[(index + 3) % mockUsers.length].user.id;
    const bodies = [
      "结构清楚，尤其是把正常流程和失败恢复放在一起说明，适合直接用于课程复盘。",
      "这份材料给出了可检查的边界，比只展示最终界面更容易理解系统为什么这样设计。",
      "建议阅读时同步查看公开版本与证明页，能更直观地理解业务事实之间的对应关系。",
      "示例中的权限、版本和错误状态很完整，我会把这套检查顺序用于自己的工程实践。",
      "对概念的限制条件说明得很克制，也避免把技术存证误解成内容真实性背书。",
    ];
    return createStoredComment(
      id,
      authorId,
      null,
      id,
      bodies[index % bodies.length],
      isoBefore(18 + index * 7),
      resource.id,
    );
  });

const generatedFollows: Follow[] = mockUsers.flatMap((user, index) =>
  [1, 3].map((offset) => ({
    followerId: user.user.id,
    followedId: mockUsers[(index + offset) % mockUsers.length].user.id,
    createdAt: isoBefore(24 + index * 13 + offset),
  })),
);

const generatedNotifications: Notification[] = mockPublishedResources
  .slice(4, 14)
  .map((resource, index) => ({
    id: `42000000-0000-4000-8001-${String(index + 1).padStart(12, "0")}`,
    type: index % 2 === 0 ? "RESOURCE_LIKED" : "FOLLOWED_AUTHOR_PUBLISHED",
    actor: {
      id: mockUsers[(index + 2) % mockUsers.length].user.id,
      handle: mockUsers[(index + 2) % mockUsers.length].user.handle,
      displayName: mockUsers[(index + 2) % mockUsers.length].user.displayName,
      avatarUrl: null,
    },
    resourceId: resource.id,
    resourceSlug: resource.slug,
    resourceTitle: resource.title,
    systemTitle: null,
    systemBody: null,
    read: index > 5,
    createdAt: isoBefore(12 + index * 9),
  }));

export const communitySeedState: CommunityState = {
  likes: generatedLikes,
  collections: [
    createCommunityCollection(defaultCollectionId, "", true, 1, isoBefore(36), isoBefore(36)),
    createCommunityCollection(
      readingCollectionId,
      "课程设计",
      false,
      1,
      isoBefore(24),
      isoBefore(24),
    ),
    createCommunityCollection(mayaDefaultCollectionId, "", true, 0, isoBefore(48), isoBefore(48)),
    createCommunityCollection(
      "40000000-0000-4000-8000-000000000004",
      "可信计算",
      false,
      0,
      isoBefore(72),
      isoBefore(30),
    ),
    createCommunityCollection(
      "40000000-0000-4000-8000-000000000005",
      "检索与推荐",
      false,
      0,
      isoBefore(96),
      isoBefore(42),
    ),
    createCommunityCollection(
      "40000000-0000-4000-8000-000000000006",
      "体验设计",
      false,
      0,
      isoBefore(120),
      isoBefore(60),
    ),
  ],
  collectionOwners: {
    [defaultCollectionId]: demoUser.user.id,
    [readingCollectionId]: demoUser.user.id,
    [mayaDefaultCollectionId]: mayaUser.user.id,
    "40000000-0000-4000-8000-000000000004": demoUser.user.id,
    "40000000-0000-4000-8000-000000000005": demoUser.user.id,
    "40000000-0000-4000-8000-000000000006": mayaUser.user.id,
  },
  collectionItems: [
    {
      collectionId: defaultCollectionId,
      resourceId: "30000000-0000-4000-8000-000000000001",
      savedAt: isoBefore(12),
    },
    {
      collectionId: readingCollectionId,
      resourceId: "30000000-0000-4000-8000-000000000003",
      savedAt: isoBefore(7),
    },
    ...mockPublishedResources.slice(4, 16).map((resource, index) => ({
      collectionId:
        index % 3 === 0
          ? "40000000-0000-4000-8000-000000000004"
          : index % 3 === 1
            ? "40000000-0000-4000-8000-000000000005"
            : "40000000-0000-4000-8000-000000000006",
      resourceId: resource.id,
      savedAt: isoBefore(15 + index * 4),
    })),
  ],
  comments: [
    createStoredComment(
      rootCommentId,
      mayaUser.user.id,
      null,
      rootCommentId,
      "把正文和附件顺序也纳入摘要输入很重要，否则同一组文件可能产生不同解释。",
      isoBefore(20),
    ),
    createStoredComment(
      demoCommentId,
      demoUser.user.id,
      null,
      demoCommentId,
      "我更关心公开版本冻结后，后续更正怎样既不覆盖旧事实又保持阅读体验。",
      isoBefore(10),
    ),
    createStoredComment(
      replyCommentId,
      mayaUser.user.id,
      demoCommentId,
      demoCommentId,
      "可以用新版本承载更正，并在公开页明确版本关系；旧摘要继续对应旧版本。",
      isoBefore(8),
    ),
    ...generatedComments,
  ],
  follows: generatedFollows,
  notifications: [
    {
      id: "42000000-0000-4000-8000-000000000001",
      type: "COMMENT_REPLY",
      actor: {
        id: mayaUser.user.id,
        handle: mayaUser.user.handle,
        displayName: mayaUser.user.displayName,
        avatarUrl: mayaUser.user.avatarUrl,
      },
      resourceId: "30000000-0000-4000-8000-000000000001",
      resourceSlug: "deterministic-evidence-for-learning-resources",
      resourceTitle: "教育资源如何形成可重复核验的内容摘要",
      commentId: replyCommentId,
      systemTitle: null,
      systemBody: null,
      read: false,
      createdAt: isoBefore(8),
    },
    {
      id: "42000000-0000-4000-8000-000000000002",
      type: "EVIDENCE_RESULT",
      resourceId: "30000000-0000-4000-8000-000000000003",
      resourceSlug: "explainable-search-ranking-basics",
      resourceTitle: "可解释检索排序的基础信号",
      systemTitle: null,
      systemBody: null,
      read: true,
      createdAt: isoBefore(30),
    },
    ...generatedNotifications,
  ],
  notificationRecipients: {
    "42000000-0000-4000-8000-000000000001": demoUser.user.id,
    "42000000-0000-4000-8000-000000000002": demoUser.user.id,
    ...Object.fromEntries(generatedNotifications.map((item) => [item.id, demoUser.user.id])),
  },
  preferences: {},
};

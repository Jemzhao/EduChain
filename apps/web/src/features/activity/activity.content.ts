import { t, type Dictionary } from "intlayer";

const activityContent = {
  key: "activity-page",
  content: {
    eyebrow: t({ "zh-CN": "个人动态", en: "Your activity" }),
    title: t({ "zh-CN": "浏览、互动与推荐", en: "History, activity and recommendations" }),
    description: t({
      "zh-CN": "回看近期访问和互动，并基于最少必要行为信号发现相关内容。",
      en: "Revisit recent views and interactions, then discover related knowledge from minimal signals.",
    }),
    historyTitle: t({ "zh-CN": "浏览记录", en: "Browsing history" }),
    clearHistory: t({ "zh-CN": "清除记录", en: "Clear history" }),
    clearingHistory: t({ "zh-CN": "正在清除…", en: "Clearing…" }),
    historyEmpty: t({
      "zh-CN": "阅读公开资源后会显示在这里。",
      en: "Public resources appear here after you read them.",
    }),
    viewedAt: t({ "zh-CN": "最近浏览", en: "Last viewed" }),
    activityTitle: t({ "zh-CN": "互动动态", en: "Recent activity" }),
    activityEmpty: t({ "zh-CN": "还没有互动记录。", en: "No interaction activity yet." }),
    viewedResource: t({ "zh-CN": "浏览了资源", en: "Viewed a resource" }),
    likedResource: t({ "zh-CN": "点赞了资源", en: "Liked a resource" }),
    savedResource: t({ "zh-CN": "收藏了资源", en: "Saved a resource" }),
    commentedResource: t({ "zh-CN": "评论了资源", en: "Commented on a resource" }),
    publishedResource: t({ "zh-CN": "发布了资源", en: "Published a resource" }),
    recommendationsTitle: t({ "zh-CN": "为你推荐", en: "Recommended for you" }),
    recommendationsDescription: t({
      "zh-CN": "结合内容质量、互动与未读优先规则生成，可随浏览记录一起清除个性化信号。",
      en: "Ranked from content quality, engagement and unread preference; clearing history removes personalization signals.",
    }),
    recommendationDismiss: t({ "zh-CN": "不再推荐", en: "Not for me" }),
    recommendationDismissError: t({
      "zh-CN": "暂时无法更新推荐偏好。",
      en: "Recommendation feedback could not be saved.",
    }),
    loading: t({ "zh-CN": "正在整理个人动态…", en: "Loading your activity…" }),
    loadError: t({ "zh-CN": "暂时无法读取个人动态。", en: "Your activity could not be loaded." }),
    authenticationRequired: t({
      "zh-CN": "登录后才能查看个人动态。",
      en: "Sign in to view your activity.",
    }),
    signInAction: t({ "zh-CN": "前往登录", en: "Go to sign in" }),
  },
} satisfies Dictionary;

export default activityContent;

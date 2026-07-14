import { t, type Dictionary } from "intlayer";

const interactionsContent = {
  key: "interactions",
  content: {
    like: t({ "zh-CN": "点赞", en: "Like" }),
    unlike: t({ "zh-CN": "取消点赞", en: "Unlike" }),
    save: t({ "zh-CN": "收藏", en: "Save" }),
    manageSave: t({ "zh-CN": "选择收藏夹", en: "Choose collections" }),
    defaultCollection: t({ "zh-CN": "默认收藏", en: "Saved" }),
    signInToInteract: t({
      "zh-CN": "登录后即可点赞、收藏和参与讨论",
      en: "Sign in to like, save and join the discussion",
    }),
    signInAction: t({ "zh-CN": "前往登录", en: "Sign in" }),
    actionError: t({
      "zh-CN": "暂时无法更新互动状态。",
      en: "The interaction could not be updated.",
    }),
    commentsTitle: t({ "zh-CN": "讨论", en: "Discussion" }),
    commentsDescription: t({
      "zh-CN": "围绕内容本身补充证据、方法与不同观点。回复限制为一层，便于阅读。",
      en: "Add evidence, methods and perspectives about the content. Replies stay one level deep.",
    }),
    commentPlaceholder: t({
      "zh-CN": "写下清晰、具体且与资源相关的内容",
      en: "Write something clear, specific and relevant",
    }),
    commentAction: t({ "zh-CN": "发表评论", en: "Post comment" }),
    replyingAction: t({ "zh-CN": "回复", en: "Reply" }),
    cancelReply: t({ "zh-CN": "取消", en: "Cancel" }),
    deleteComment: t({ "zh-CN": "删除", en: "Delete" }),
    deletedComment: t({
      "zh-CN": "这条评论已由作者删除。",
      en: "This comment was deleted by its author.",
    }),
    hiddenComment: t({
      "zh-CN": "这条评论已由平台隐藏。",
      en: "This comment was hidden by moderation.",
    }),
    commentError: t({
      "zh-CN": "评论未能提交，请检查内容后重试。",
      en: "The comment could not be posted. Review it and try again.",
    }),
    loadingComments: t({ "zh-CN": "正在读取讨论…", en: "Loading discussion…" }),
    commentsUnavailable: t({
      "zh-CN": "讨论暂时无法读取。",
      en: "Discussion is temporarily unavailable.",
    }),
    emptyComments: t({
      "zh-CN": "还没有评论。你可以提出第一个具体问题。",
      en: "No comments yet. You can ask the first specific question.",
    }),
    replyCount: t({ "zh-CN": "条回复", en: "replies" }),
    follow: t({ "zh-CN": "关注", en: "Follow" }),
    following: t({ "zh-CN": "已关注", en: "Following" }),
    followError: t({
      "zh-CN": "暂时无法更新关注关系。",
      en: "The follow state could not be updated.",
    }),
  },
} satisfies Dictionary;

export default interactionsContent;

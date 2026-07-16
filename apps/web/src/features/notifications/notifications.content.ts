import { t, type Dictionary } from "intlayer";

const notificationsContent = {
  key: "notifications",
  content: {
    eyebrow: t({ "zh-CN": "动态与结果", en: "Updates and outcomes" }),
    title: t({ "zh-CN": "通知", en: "Notifications" }),
    description: t({
      "zh-CN": "只展示与你的讨论、关注、内容状态和存证结果直接相关的信息。",
      en: "Only updates directly related to discussions, follows, content state and evidence results.",
    }),
    unreadCount: t({ "zh-CN": "条未读", en: "unread" }),
    markAllRead: t({ "zh-CN": "全部标为已读", en: "Mark all as read" }),
    markRead: t({ "zh-CN": "标为已读", en: "Mark as read" }),
    markUnread: t({ "zh-CN": "标为未读", en: "Mark as unread" }),
    selectNotification: t({ "zh-CN": "选择通知", en: "Select notification" }),
    deleteOne: t({ "zh-CN": "删除通知", en: "Delete notification" }),
    deleteSelected: t({ "zh-CN": "删除所选", en: "Delete selected" }),
    clearAll: t({ "zh-CN": "清空全部", en: "Clear all" }),
    deletionTitle: t({ "zh-CN": "确认永久删除通知", en: "Permanently delete notifications?" }),
    deletionOne: t({
      "zh-CN": "这条通知将无法恢复。",
      en: "This notification cannot be recovered.",
    }),
    deletionSelected: t({
      "zh-CN": "所选通知将无法恢复。",
      en: "The selected notifications cannot be recovered.",
    }),
    deletionAll: t({
      "zh-CN": "所有通知都将被永久删除，此操作无法撤销。",
      en: "Every notification will be permanently deleted. This cannot be undone.",
    }),
    confirmDelete: t({ "zh-CN": "确认删除", en: "Delete" }),
    cancelDelete: t({ "zh-CN": "取消", en: "Cancel" }),
    deletionError: t({
      "zh-CN": "通知未能删除，请稍后重试。",
      en: "Notifications could not be deleted. Try again shortly.",
    }),
    preferencesAction: t({ "zh-CN": "通知偏好", en: "Preferences" }),
    allFilter: t({ "zh-CN": "全部", en: "All" }),
    unreadFilter: t({ "zh-CN": "仅未读", en: "Unread" }),
    loading: t({ "zh-CN": "正在读取通知…", en: "Loading notifications…" }),
    empty: t({ "zh-CN": "这里暂时没有通知。", en: "There are no notifications here." }),
    error: t({ "zh-CN": "暂时无法读取通知。", en: "Notifications could not be loaded." }),
    authenticationRequired: t({
      "zh-CN": "登录后才能查看通知。",
      en: "Sign in to view notifications.",
    }),
    commentReply: t({ "zh-CN": "回复了你的评论", en: "replied to your comment" }),
    resourceLiked: t({ "zh-CN": "赞了你的资源", en: "liked your resource" }),
    resourceComment: t({ "zh-CN": "评论了你的资源", en: "commented on your resource" }),
    followedAuthorPublished: t({
      "zh-CN": "发布了新资源",
      en: "published a new resource",
    }),
    newFollower: t({ "zh-CN": "关注了你", en: "followed you" }),
    resourceStatus: t({ "zh-CN": "资源状态已更新", en: "Resource status changed" }),
    evidenceResult: t({ "zh-CN": "存证处理有了新结果", en: "Evidence processing has an update" }),
    systemAnnouncement: t({ "zh-CN": "发布了系统公告", en: "published a system announcement" }),
    systemActor: t({ "zh-CN": "EduChain", en: "EduChain" }),
    preferencesEyebrow: t({ "zh-CN": "通知设置", en: "Notification settings" }),
    preferencesTitle: t({
      "zh-CN": "决定哪些信息需要打扰你",
      en: "Choose what deserves your attention",
    }),
    preferencesDescription: t({
      "zh-CN": "站内通知与外部通道分别控制；关闭只影响后续通知，不删除既有记录。",
      en: "Control in-app and external channels separately. Changes affect future notifications only.",
    }),
    inAppChannel: t({ "zh-CN": "站内", en: "In app" }),
    externalChannel: t({ "zh-CN": "外部通道", en: "External" }),
    savePreferences: t({ "zh-CN": "保存偏好", en: "Save preferences" }),
    saved: t({ "zh-CN": "偏好已保存", en: "Preferences saved" }),
    preferencesError: t({
      "zh-CN": "偏好未能保存，请稍后重试。",
      en: "Preferences could not be saved. Try again shortly.",
    }),
    typeCommentReply: t({ "zh-CN": "评论回复", en: "Comment replies" }),
    typeResourceLiked: t({ "zh-CN": "资源获赞", en: "Resource likes" }),
    typeResourceComment: t({ "zh-CN": "资源评论", en: "Resource comments" }),
    typeFollowedAuthorPublished: t({
      "zh-CN": "关注作者发布",
      en: "Followed author publications",
    }),
    typeNewFollower: t({ "zh-CN": "新关注者", en: "New followers" }),
    typeResourceStatus: t({ "zh-CN": "内容状态", en: "Content status" }),
    typeEvidenceResult: t({ "zh-CN": "存证结果", en: "Evidence results" }),
    typeSystemAnnouncement: t({ "zh-CN": "系统公告", en: "System announcements" }),
  },
} satisfies Dictionary;

export default notificationsContent;

import { t, type Dictionary } from "intlayer";

const achievementsContent = {
  key: "achievements-page",
  content: {
    eyebrow: t({ "zh-CN": "可解释贡献", en: "Explainable contribution" }),
    title: t({ "zh-CN": "成就与等级", en: "Achievements and levels" }),
    description: t({
      "zh-CN": "所有积分都由可核对的贡献数据计算。等级用于呈现参与深度，不构成学术能力认证。",
      en: "Every point is calculated from auditable contribution data. Levels show participation depth, not academic certification.",
    }),
    loading: t({ "zh-CN": "正在计算贡献进度…", en: "Calculating contribution progress…" }),
    loadError: t({
      "zh-CN": "贡献进度暂时无法读取。",
      en: "Contribution progress is unavailable.",
    }),
    signInTitle: t({ "zh-CN": "登录后查看个人进度", en: "Sign in to see your progress" }),
    signInDescription: t({
      "zh-CN": "成就目录与排行榜保持公开，个人统计仅本人可见。",
      en: "The catalog and leaderboard stay public; personal statistics are private.",
    }),
    signInAction: t({ "zh-CN": "登录", en: "Sign in" }),
    myProgress: t({ "zh-CN": "我的进度", en: "My progress" }),
    totalPoints: t({ "zh-CN": "总积分", en: "Total points" }),
    unlocked: t({ "zh-CN": "已解锁", en: "Unlocked" }),
    nextLevel: t({ "zh-CN": "下一等级", en: "Next level" }),
    highestLevel: t({ "zh-CN": "已达到最高等级", en: "Highest level reached" }),
    catalogTitle: t({ "zh-CN": "成就目录", en: "Achievement catalog" }),
    catalogDescription: t({
      "zh-CN": "进度实时来自发布、评论、获赞、关注与阅读记录。",
      en: "Progress is derived live from publications, comments, received likes, followers and reading activity.",
    }),
    progress: t({ "zh-CN": "进度", en: "Progress" }),
    reward: t({ "zh-CN": "奖励", en: "Reward" }),
    leaderboardTitle: t({ "zh-CN": "贡献者排行榜", en: "Contributor leaderboard" }),
    rank: t({ "zh-CN": "排名", en: "Rank" }),
    contributor: t({ "zh-CN": "贡献者", en: "Contributor" }),
    publications: t({ "zh-CN": "发布", en: "Publications" }),
    receivedLikes: t({ "zh-CN": "获赞", en: "Received likes" }),
    points: t({ "zh-CN": "积分", en: "Points" }),
    levelLearner: t({ "zh-CN": "学习者", en: "Learner" }),
    levelContributor: t({ "zh-CN": "贡献者", en: "Contributor" }),
    levelCurator: t({ "zh-CN": "策展者", en: "Curator" }),
    levelScholar: t({ "zh-CN": "求知者", en: "Scholar" }),
    levelMentor: t({ "zh-CN": "引导者", en: "Mentor" }),
    firstPublicationTitle: t({ "zh-CN": "第一次分享", en: "First publication" }),
    firstPublicationDescription: t({
      "zh-CN": "公开发布第一项教育资源。",
      en: "Publish your first educational resource.",
    }),
    knowledgeBuilderTitle: t({ "zh-CN": "知识建设者", en: "Knowledge builder" }),
    knowledgeBuilderDescription: t({
      "zh-CN": "持续发布五项教育资源。",
      en: "Publish five educational resources.",
    }),
    communityVoiceTitle: t({ "zh-CN": "社区之声", en: "Community voice" }),
    communityVoiceDescription: t({
      "zh-CN": "参与十次公开讨论。",
      en: "Contribute ten public comments.",
    }),
    appreciatedTitle: t({ "zh-CN": "受到认可", en: "Appreciated" }),
    appreciatedDescription: t({
      "zh-CN": "发布的资源累计获得二十五次点赞。",
      en: "Receive twenty-five likes across your resources.",
    }),
    trustedCreatorTitle: t({ "zh-CN": "可信创作者", en: "Trusted creator" }),
    trustedCreatorDescription: t({
      "zh-CN": "获得十位社区成员关注。",
      en: "Earn ten community followers.",
    }),
    curiousReaderTitle: t({ "zh-CN": "好奇的阅读者", en: "Curious reader" }),
    curiousReaderDescription: t({
      "zh-CN": "完成二十次资源阅读记录。",
      en: "Record twenty resource views.",
    }),
  },
} satisfies Dictionary;

export default achievementsContent;

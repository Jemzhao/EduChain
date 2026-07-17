import { t, type Dictionary } from "intlayer";

const communityContent = {
  key: "community-page",
  content: {
    eyebrow: t({ "zh-CN": "共同学习", en: "Learning together" }),
    title: t({ "zh-CN": "社区", en: "Community" }),
    description: t({
      "zh-CN": "从公开知识、真实互动与持续贡献中，看见正在形成的学习共同体。",
      en: "See a learning community emerge from public knowledge, meaningful interaction and sustained contribution.",
    }),
    loading: t({ "zh-CN": "正在整理社区内容…", en: "Preparing the community view…" }),
    loadError: t({ "zh-CN": "社区内容暂时无法读取。", en: "Community content is unavailable." }),
    globalFeed: t({ "zh-CN": "全站动态", en: "Global feed" }),
    followingFeed: t({ "zh-CN": "我的关注", en: "Following" }),
    followingHint: t({
      "zh-CN": "登录后可查看关注作者的新发布。",
      en: "Sign in to see new publications from creators you follow.",
    }),
    members: t({ "zh-CN": "成员", en: "Members" }),
    resources: t({ "zh-CN": "公开资源", en: "Published resources" }),
    likes: t({ "zh-CN": "点赞", en: "Likes" }),
    comments: t({ "zh-CN": "评论", en: "Comments" }),
    topicsTitle: t({ "zh-CN": "热门话题", en: "Popular topics" }),
    topicsDescription: t({
      "zh-CN": "按公开资源中的规范标签聚合，不制造额外的话题孤岛。",
      en: "Aggregated from governed tags on public resources, without creating a separate taxonomy.",
    }),
    creatorsTitle: t({ "zh-CN": "活跃创作者", en: "Active creators" }),
    creatorResources: t({ "zh-CN": "项资源", en: "resources" }),
    engagement: t({ "zh-CN": "贡献热度", en: "Contribution signal" }),
    feedTitle: t({ "zh-CN": "最新发布", en: "Latest publications" }),
    feedEmpty: t({
      "zh-CN": "这个范围内暂时没有新发布。",
      en: "No publications in this feed yet.",
    }),
    paginationLabel: t({ "zh-CN": "社区内容分页", en: "Community feed pagination" }),
    previousPage: t({ "zh-CN": "上一页", en: "Previous" }),
    nextPage: t({ "zh-CN": "下一页", en: "Next" }),
    pagePrefix: t({ "zh-CN": "当前第", en: "Page" }),
    pageSuffix: t({ "zh-CN": "页", en: "" }),
    published: t({ "zh-CN": "发布了新资源", en: "published a new resource" }),
    leaderboardTitle: t({ "zh-CN": "贡献榜", en: "Contributor board" }),
    leaderboardDescription: t({
      "zh-CN": "积分规则公开、结果可重复计算，重视稳定贡献而非短期噪声。",
      en: "Public, reproducible scoring values sustained contribution over short-lived noise.",
    }),
    points: t({ "zh-CN": "积分", en: "points" }),
    viewAchievements: t({ "zh-CN": "查看成就与规则", en: "View achievements and rules" }),
  },
} satisfies Dictionary;

export default communityContent;

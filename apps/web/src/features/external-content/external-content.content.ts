import { t, type Dictionary } from "intlayer";

const externalContent = {
  key: "external-content",
  content: {
    eyebrow: t({ "zh-CN": "精选开放资源", en: "Curated open resources" }),
    title: t({ "zh-CN": "外部教育内容", en: "External educational content" }),
    description: t({
      "zh-CN":
        "从明确登记的教育来源中发现经过人工质量审核的内容。链接会离开 EduChain，版权与可用性以原站说明为准。",
      en: "Discover human-reviewed material from explicitly registered educational sources. Links leave EduChain; licensing and availability remain governed by the original site.",
    }),
    searchLabel: t({ "zh-CN": "检索外部内容", en: "Search external content" }),
    searchPlaceholder: t({
      "zh-CN": "输入标题、摘要或作者",
      en: "Search title, summary or author",
    }),
    searchAction: t({ "zh-CN": "检索", en: "Search" }),
    results: t({ "zh-CN": "审核通过的结果", en: "Approved results" }),
    source: t({ "zh-CN": "来源", en: "Source" }),
    author: t({ "zh-CN": "作者", en: "Author" }),
    openOriginal: t({ "zh-CN": "前往原文", en: "Open original" }),
    empty: t({
      "zh-CN": "没有找到符合条件且已通过审核的外部内容。",
      en: "No approved external content matches this search.",
    }),
    loading: t({ "zh-CN": "正在读取精选内容…", en: "Loading curated content…" }),
    loadFailed: t({
      "zh-CN": "外部内容目录暂时不可用。",
      en: "The external content catalog is temporarily unavailable.",
    }),
    boundary: t({
      "zh-CN":
        "EduChain 只保存用于发现的元数据与规范链接，不复制原站正文，也不把外部内容自动视为可信事实。",
      en: "EduChain stores discovery metadata and canonical links only. It does not copy source articles or treat external content as automatically trustworthy.",
    }),
  },
} satisfies Dictionary;

export default externalContent;

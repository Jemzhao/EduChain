import { t, type Dictionary } from "intlayer";

const homeContent = {
  key: "home-page",
  content: {
    eyebrow: t({
      "zh-CN": "可信的教育知识基础设施",
      en: "Trusted infrastructure for educational knowledge",
    }),
    title: t({
      "zh-CN": "让优质知识被发现，也让原创价值被证明。",
      en: "Make valuable knowledge discoverable—and original work verifiable.",
    }),
    description: t({
      "zh-CN":
        "EduChain 将清晰的内容创作、可解释的智能检索与可核验的区块链存证连接在同一个克制、可信的产品体验中。",
      en: "EduChain brings clear publishing, explainable discovery and verifiable blockchain evidence into one calm, trustworthy experience.",
    }),
    primaryAction: t({
      "zh-CN": "探索知识",
      en: "Explore knowledge",
    }),
    secondaryAction: t({
      "zh-CN": "了解存证流程",
      en: "See how evidence works",
    }),
    foundationLabel: t({
      "zh-CN": "从内容到证明",
      en: "From content to evidence",
    }),
    foundationTitle: t({
      "zh-CN": "技术退到幕后，可信体验留在前台。",
      en: "Technology stays in the background. Trust stays visible.",
    }),
    publishTitle: t({
      "zh-CN": "清晰创作",
      en: "Clear publishing",
    }),
    publishDescription: t({
      "zh-CN": "从草稿、附件到公开版本，每一步都有明确状态与可恢复路径。",
      en: "Drafts, attachments and public versions each have explicit states and recovery paths.",
    }),
    searchTitle: t({
      "zh-CN": "智能检索",
      en: "Explainable discovery",
    }),
    searchDescription: t({
      "zh-CN": "综合文本、分类、质量与时效信号，让排序结果稳定且可以解释。",
      en: "Text, taxonomy, quality and freshness signals create stable results people can understand.",
    }),
    evidenceTitle: t({
      "zh-CN": "可信存证",
      en: "Verifiable evidence",
    }),
    evidenceDescription: t({
      "zh-CN": "内容摘要、作者标识和确认记录共同形成可公开核验的原创证明。",
      en: "Content digests, creator identity and confirmation records form evidence anyone can verify.",
    }),
    workflowLabel: t({
      "zh-CN": "核心流程",
      en: "Core workflow",
    }),
    workflowTitle: t({
      "zh-CN": "一个从发布到核验的完整闭环。",
      en: "One complete path from publishing to verification.",
    }),
    stepDraft: t({
      "zh-CN": "创建资源版本",
      en: "Create a resource version",
    }),
    stepDigest: t({
      "zh-CN": "生成确定性摘要",
      en: "Generate a deterministic digest",
    }),
    stepEvidence: t({
      "zh-CN": "提交并确认存证",
      en: "Submit and confirm evidence",
    }),
    stepVerify: t({
      "zh-CN": "公开核验与证书",
      en: "Public verification and certificate",
    }),
  },
} satisfies Dictionary;

export default homeContent;

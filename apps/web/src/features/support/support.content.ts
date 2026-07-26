import { t, type Dictionary } from "intlayer";

const supportContent = {
  key: "support",
  content: {
    eyebrow: t({ "zh-CN": "账户支持", en: "Account support" }),
    title: t({ "zh-CN": "支持工单", en: "Support tickets" }),
    description: t({
      "zh-CN": "提交需要持续跟进的问题，并在一个有边界、可追踪的会话中查看处理进展。",
      en: "Submit issues that need follow-up and track progress in one bounded conversation.",
    }),
    authenticationRequired: t({
      "zh-CN": "登录后才能创建和查看自己的支持工单。",
      en: "Sign in to create and view your support tickets.",
    }),
    signIn: t({ "zh-CN": "前往登录", en: "Go to sign in" }),
    newTicket: t({ "zh-CN": "新建工单", en: "New ticket" }),
    myTickets: t({ "zh-CN": "我的工单", en: "My tickets" }),
    category: t({ "zh-CN": "问题类型", en: "Issue category" }),
    subject: t({ "zh-CN": "主题", en: "Subject" }),
    subjectPlaceholder: t({
      "zh-CN": "简要说明需要解决的问题",
      en: "Briefly describe what needs to be resolved",
    }),
    descriptionLabel: t({ "zh-CN": "问题说明", en: "Issue details" }),
    descriptionPlaceholder: t({
      "zh-CN": "说明发生了什么、期望结果和必要的对象标识。请勿填写密码等敏感凭据。",
      en: "Explain what happened, the expected result and necessary object identifiers. Never include passwords or secrets.",
    }),
    create: t({ "zh-CN": "提交工单", en: "Submit ticket" }),
    cancel: t({ "zh-CN": "取消", en: "Cancel" }),
    creating: t({ "zh-CN": "正在提交…", en: "Submitting…" }),
    createFailed: t({
      "zh-CN": "工单未能提交，请检查内容后重试。",
      en: "The ticket could not be submitted. Review the details and try again.",
    }),
    empty: t({ "zh-CN": "还没有支持工单。", en: "No support tickets yet." }),
    selectHint: t({
      "zh-CN": "选择一条工单查看完整会话。",
      en: "Select a ticket to read the full conversation.",
    }),
    originalRequest: t({ "zh-CN": "原始问题", en: "Original request" }),
    conversation: t({ "zh-CN": "处理会话", en: "Conversation" }),
    noMessages: t({
      "zh-CN": "暂时没有补充消息，处理人员会在此回复。",
      en: "There are no follow-up messages yet. Staff responses appear here.",
    }),
    staff: t({ "zh-CN": "支持团队", en: "Support team" }),
    you: t({ "zh-CN": "你", en: "You" }),
    reply: t({ "zh-CN": "补充信息", en: "Add information" }),
    replyPlaceholder: t({
      "zh-CN": "补充与问题直接相关的信息",
      en: "Add information directly related to the issue",
    }),
    send: t({ "zh-CN": "发送", en: "Send" }),
    sending: t({ "zh-CN": "正在发送…", en: "Sending…" }),
    closedHint: t({
      "zh-CN": "这条工单已关闭，不能继续回复。如有新问题，请建立新工单。",
      en: "This ticket is closed. Open a new ticket for a new issue.",
    }),
    loadFailed: t({
      "zh-CN": "暂时无法读取工单，请稍后重试。",
      en: "Tickets are temporarily unavailable. Try again later.",
    }),
    statusOpen: t({ "zh-CN": "待受理", en: "Open" }),
    statusInProgress: t({ "zh-CN": "处理中", en: "In progress" }),
    statusWaitingForUser: t({ "zh-CN": "等待你的回复", en: "Waiting for you" }),
    statusResolved: t({ "zh-CN": "已解决", en: "Resolved" }),
    statusClosed: t({ "zh-CN": "已关闭", en: "Closed" }),
    priorityHigh: t({ "zh-CN": "高优先级", en: "High priority" }),
    categoryAccount: t({ "zh-CN": "账户与资料", en: "Account and profile" }),
    categoryContent: t({ "zh-CN": "资源与互动", en: "Content and interaction" }),
    categoryCopyright: t({ "zh-CN": "版权问题", en: "Copyright" }),
    categoryEvidence: t({ "zh-CN": "存证与核验", en: "Evidence and verification" }),
    categoryTechnical: t({ "zh-CN": "技术问题", en: "Technical issue" }),
    categoryOther: t({ "zh-CN": "其他", en: "Other" }),
  },
} satisfies Dictionary;

export default supportContent;

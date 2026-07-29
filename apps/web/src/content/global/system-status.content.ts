import { t, type Dictionary } from "intlayer";

const systemStatusContent = {
  key: "system-status",
  content: {
    title: t({
      "zh-CN": "系统连接",
      en: "System connection",
    }),
    checking: t({
      "zh-CN": "正在确认服务状态",
      en: "Checking service status",
    }),
    available: t({
      "zh-CN": "服务已就绪",
      en: "Service ready",
    }),
    unavailable: t({
      "zh-CN": "服务暂时不可用",
      en: "Service temporarily unavailable",
    }),
    retry: t({
      "zh-CN": "重新连接",
      en: "Reconnect",
    }),
    mockMode: t({
      "zh-CN": "Mock 模式",
      en: "Mock mode",
    }),
    remoteMode: t({
      "zh-CN": "真实后端模式",
      en: "Remote backend mode",
    }),
  },
} satisfies Dictionary;

export default systemStatusContent;

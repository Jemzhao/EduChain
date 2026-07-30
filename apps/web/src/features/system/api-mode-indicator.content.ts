import { t, type Dictionary } from "intlayer";

const apiModeIndicatorContent = {
  key: "api-mode-indicator",
  content: {
    label: t({ "zh-CN": "数据连接", en: "Data connection" }),
    mock: t({ "zh-CN": "本地演示数据", en: "Local demo data" }),
    remote: t({ "zh-CN": "真实服务", en: "Live service" }),
  },
} satisfies Dictionary;

export default apiModeIndicatorContent;

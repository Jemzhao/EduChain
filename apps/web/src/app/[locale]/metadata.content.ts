import { t, type Dictionary } from "intlayer";
import type { Metadata } from "next";

const metadataContent = {
  key: "site-metadata",
  content: {
    title: t({
      "zh-CN": "EduChain｜教育知识共享与可信存证",
      en: "EduChain | Educational knowledge and trusted evidence",
    }),
    description: t({
      "zh-CN": "面向教育知识共享、智能检索与区块链存证的一体化平台。",
      en: "An integrated platform for educational knowledge sharing, intelligent discovery and blockchain evidence.",
    }),
  },
} satisfies Dictionary<Metadata>;

export default metadataContent;

import { t, type Dictionary } from "intlayer";

const ledgerContent = {
  key: "ledger-page",
  content: {
    eyebrow: t({ "zh-CN": "存证追溯", en: "Evidence trace" }),
    title: t({ "zh-CN": "链上信息", en: "Ledger explorer" }),
    description: t({
      "zh-CN":
        "按交易标识和区块查看 EduChain 已确认的存证事实，并始终区分真实长安链与本地模拟记录。",
      en: "Inspect confirmed EduChain evidence by transaction and block, with ChainMaker and local simulator records always distinguished.",
    }),
    scopeNotice: t({
      "zh-CN": "这里仅索引本系统已知的教育资源存证，不是通用区块链浏览器。",
      en: "This view indexes only educational evidence known to this application; it is not a general-purpose blockchain explorer.",
    }),
    searchLabel: t({
      "zh-CN": "证明编号、交易、区块高度或内容摘要",
      en: "Proof, transaction, block height or digest",
    }),
    searchPlaceholder: t({
      "zh-CN": "输入完整编号、高度或 SHA-256 摘要",
      en: "Enter an exact identifier, height or SHA-256 digest",
    }),
    searchAction: t({ "zh-CN": "全局查询", en: "Search ledger" }),
    invalidSearch: t({
      "zh-CN": "请输入要查询的内容。",
      en: "Enter a value to search.",
    }),
    searchResults: t({ "zh-CN": "查询结果", en: "Search results" }),
    openResult: t({ "zh-CN": "查看记录", en: "Open record" }),
    kindProof: t({ "zh-CN": "证明", en: "Proof" }),
    kindTransaction: t({ "zh-CN": "交易", en: "Transaction" }),
    kindBlock: t({ "zh-CN": "区块", en: "Block" }),
    kindDigest: t({ "zh-CN": "内容摘要", en: "Digest" }),
    recentBlocks: t({ "zh-CN": "最近区块", en: "Recent blocks" }),
    loading: t({ "zh-CN": "正在读取存证索引…", en: "Loading the evidence index…" }),
    notFound: t({ "zh-CN": "没有找到对应记录。", en: "No matching record was found." }),
    loadError: t({ "zh-CN": "存证索引暂时无法读取。", en: "The evidence index is unavailable." }),
    backend: t({ "zh-CN": "来源", en: "Backend" }),
    sourceSimulator: t({ "zh-CN": "本地模拟器", en: "Local simulator" }),
    sourceChainMaker: t({ "zh-CN": "长安链", en: "ChainMaker" }),
    network: t({ "zh-CN": "网络", en: "Network" }),
    blockHeight: t({ "zh-CN": "区块高度", en: "Block height" }),
    blockHash: t({ "zh-CN": "区块摘要", en: "Block hash" }),
    transactions: t({ "zh-CN": "交易数", en: "Transactions" }),
    confirmed: t({ "zh-CN": "确认记录", en: "Confirmed" }),
    blockTitle: t({ "zh-CN": "区块详情", en: "Block details" }),
    transactionTitle: t({ "zh-CN": "交易详情", en: "Transaction details" }),
    proofId: t({ "zh-CN": "证明编号", en: "Proof ID" }),
    resourceId: t({ "zh-CN": "资源编号", en: "Resource ID" }),
    versionId: t({ "zh-CN": "版本编号", en: "Version ID" }),
    contentDigest: t({ "zh-CN": "内容摘要", en: "Content digest" }),
    submitted: t({ "zh-CN": "提交记录", en: "Submitted" }),
    transactionId: t({ "zh-CN": "交易标识", en: "Transaction ID" }),
    viewBlock: t({ "zh-CN": "查看区块", en: "View block" }),
    viewProof: t({ "zh-CN": "查看公开证明", en: "View public proof" }),
    verifyTransaction: t({
      "zh-CN": "使用此交易核验摘要",
      en: "Verify a digest against this transaction",
    }),
    backToLedger: t({ "zh-CN": "返回链上信息", en: "Back to ledger" }),
    simulatorWarning: t({
      "zh-CN": "模拟器区块只用于本地演示，不代表真实区块链确认。",
      en: "Simulator blocks are for local demonstrations and do not represent real blockchain confirmation.",
    }),
  },
} satisfies Dictionary;

export default ledgerContent;

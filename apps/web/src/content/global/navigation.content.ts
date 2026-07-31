import { t, type Dictionary } from "intlayer";

const navigationContent = {
  key: "global-navigation",
  content: {
    brand: "EduChain",
    discover: t({
      "zh-CN": "发现",
      en: "Discover",
    }),
    verify: t({
      "zh-CN": "存证核验",
      en: "Verify evidence",
    }),
    community: t({
      "zh-CN": "社区",
      en: "Community",
    }),
    ledger: t({
      "zh-CN": "链上信息",
      en: "Ledger",
    }),
    information: t({ "zh-CN": "项目信息", en: "Project information" }),
    primaryNavigation: t({ "zh-CN": "主要导航", en: "Primary navigation" }),
    accountNavigation: t({ "zh-CN": "账户导航", en: "Account navigation" }),
    openMenu: t({ "zh-CN": "打开导航菜单", en: "Open navigation menu" }),
    closeMenu: t({ "zh-CN": "关闭导航菜单", en: "Close navigation menu" }),
    help: t({ "zh-CN": "帮助", en: "Help" }),
    guides: t({ "zh-CN": "指南", en: "Guides" }),
    developers: t({ "zh-CN": "开发者", en: "Developers" }),
    changelog: t({ "zh-CN": "变更说明", en: "Changelog" }),
    about: t({ "zh-CN": "关于", en: "About" }),
    contact: t({ "zh-CN": "联系", en: "Contact" }),
    support: t({ "zh-CN": "支持工单", en: "Support tickets" }),
    externalContent: t({ "zh-CN": "外部内容", en: "External content" }),
    cooperation: t({ "zh-CN": "合作", en: "Collaboration" }),
    terms: t({ "zh-CN": "服务条款", en: "Terms" }),
    privacy: t({ "zh-CN": "隐私", en: "Privacy" }),
    copyright: t({ "zh-CN": "版权", en: "Copyright" }),
    disclaimer: t({ "zh-CN": "免责声明", en: "Disclaimer" }),
    signIn: t({
      "zh-CN": "登录",
      en: "Sign in",
    }),
    profile: t({
      "zh-CN": "我的资料",
      en: "My profile",
    }),
    create: t({
      "zh-CN": "创作中心",
      en: "Studio",
    }),
    library: t({
      "zh-CN": "收藏",
      en: "Library",
    }),
    activity: t({
      "zh-CN": "动态",
      en: "Activity",
    }),
    notifications: t({
      "zh-CN": "通知",
      en: "Notifications",
    }),
    administration: t({
      "zh-CN": "管理",
      en: "Admin",
    }),
    chinese: t({
      "zh-CN": "中文",
      en: "Chinese",
    }),
    english: t({
      "zh-CN": "英文",
      en: "English",
    }),
    languageLabel: t({
      "zh-CN": "切换语言",
      en: "Change language",
    }),
    themeLabel: t({
      "zh-CN": "主题",
      en: "Theme",
    }),
    themeSystem: t({
      "zh-CN": "跟随系统",
      en: "System",
    }),
    themeLight: t({
      "zh-CN": "浅色",
      en: "Light",
    }),
    themeDark: t({
      "zh-CN": "深色",
      en: "Dark",
    }),
    themeSwitchTo: t({
      "zh-CN": "点击切换为",
      en: "Switch to",
    }),
    skipToContent: t({
      "zh-CN": "跳到主要内容",
      en: "Skip to main content",
    }),
  },
} satisfies Dictionary;

export default navigationContent;

import { t, type Dictionary } from "intlayer";

const libraryContent = {
  key: "library",
  content: {
    eyebrow: t({ "zh-CN": "个人知识库", en: "Personal library" }),
    title: t({ "zh-CN": "收藏与收藏夹", en: "Saved knowledge" }),
    description: t({
      "zh-CN": "用少量明确的收藏夹整理计划阅读、课程资料与研究参考。",
      en: "Use a small set of clear collections for reading plans, courses and research.",
    }),
    defaultCollection: t({ "zh-CN": "默认收藏", en: "Saved" }),
    newCollection: t({ "zh-CN": "新建收藏夹", en: "New collection" }),
    namePlaceholder: t({ "zh-CN": "例如：课程设计", en: "For example: Course project" }),
    createAction: t({ "zh-CN": "创建", en: "Create" }),
    renameAction: t({ "zh-CN": "重命名", en: "Rename" }),
    saveNameAction: t({ "zh-CN": "保存名称", en: "Save name" }),
    deleteAction: t({ "zh-CN": "删除收藏夹", en: "Delete collection" }),
    confirmDelete: t({ "zh-CN": "确认删除", en: "Confirm delete" }),
    cancelAction: t({ "zh-CN": "取消", en: "Cancel" }),
    removeItem: t({ "zh-CN": "移出收藏夹", en: "Remove" }),
    itemUnit: t({ "zh-CN": "项", en: "items" }),
    emptyTitle: t({ "zh-CN": "这个收藏夹还是空的", en: "This collection is empty" }),
    emptyDescription: t({
      "zh-CN": "在资源详情页选择收藏，即可把值得回看的内容放到这里。",
      en: "Choose Save on a resource page to keep knowledge worth revisiting here.",
    }),
    loading: t({ "zh-CN": "正在整理收藏…", en: "Loading your library…" }),
    error: t({ "zh-CN": "暂时无法读取收藏。", en: "Your library could not be loaded." }),
    mutationError: t({
      "zh-CN": "这次更改没有保存，请稍后重试。",
      en: "This change was not saved. Try again shortly.",
    }),
    authenticationRequired: t({
      "zh-CN": "登录后才能查看个人收藏。",
      en: "Sign in to view your saved knowledge.",
    }),
  },
} satisfies Dictionary;

export default libraryContent;

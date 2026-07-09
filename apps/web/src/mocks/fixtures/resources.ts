import type { components } from "@educhain/api-contract";

import { mockTimelineAt } from "@/mocks/clock";
import { mockUsers } from "@/mocks/fixtures/auth";
import { mockCategories, mockTags } from "@/mocks/fixtures/taxonomy";

export type MockResourceDetail = components["schemas"]["ResourceDetailResponse"];

const titles = [
  "教育资源如何形成可重复核验的内容摘要",
  "用模块化 MVC 组织复杂 Java 学习项目",
  "可解释检索排序的基础信号",
  "从 OpenAPI 契约开始设计前后端协作",
  "Cookie 会话、CSRF 与幂等写请求",
  "教育文档上传中的完整性校验",
  "长安链存证适配器的边界设计",
  "本地存证模拟器如何支持开发闭环",
  "用领域事件解耦资源发布与存证",
  "游标分页为什么适合社区信息流",
  "数据库事务与可靠任务表实践",
  "面向教育内容的分类体系设计",
  "标签治理：同义词、停用与合并",
  "多语言产品中的内容与界面边界",
  "Intlayer 在大型前端中的组织方法",
  "建立可复用的设计令牌系统",
  "克制而清晰的深色主题设计",
  "无障碍表单的错误反馈清单",
  "键盘用户如何完整使用内容平台",
  "可解释推荐中的冷启动处理",
  "教育检索评测集的构建方法",
  "BM25 与结构化字段权重入门",
  "从浏览行为生成可控推荐信号",
  "社区点赞数据的反滥用思路",
  "评论树与审核状态的模型设计",
  "收藏夹怎样兼顾默认与自定义场景",
  "关注与通知系统的去重策略",
  "创作者主页需要呈现哪些可信信息",
  "资源版本为什么不能原地覆盖",
  "公开证书页面的信息最小化原则",
  "SHA-256 摘要核验的教学实验",
  "附件顺序为什么会影响版本摘要",
  "操作审计记录应该回答哪些问题",
  "管理后台的权限与复核边界",
  "内容举报从提交到结案的完整流程",
  "支持工单如何保留处理上下文",
  "外部教育内容聚合的质量门槛",
  "开放许可资源发布检查表",
  "视频与外部链接资源的元数据规范",
  "从错误代码到可恢复的用户体验",
  "前端 Mock 与真实后端双模式实践",
  "可观测性在毕业设计中的落地方式",
  "慢查询与搜索性能的基础诊断",
  "数据库索引设计的验证思路",
  "教育平台隐私数据的最小化收集",
  "从威胁模型检查上传与公开阅读",
  "毕业设计技术文档的可追溯结构",
  "完整演示一次可信知识分享闭环",
] as const;

const slugs = [
  "deterministic-evidence-for-learning-resources",
  "modular-mvc-for-java-learning-projects",
  "explainable-search-ranking-basics",
  ...titles.slice(3).map((_, index) => `educhain-practice-${String(index + 4).padStart(2, "0")}`),
] as const;

const openingBodies = [
  `内容摘要的价值不在于“看起来随机”，而在于同一份规范内容无论在哪里计算，都得到完全一致的结果。\n\n发布流程先固定标题、摘要、正文、分类、标签和附件顺序，再统一换行与字符编码。随后分别计算正文和文件的 SHA-256，并把这些稳定事实组合成版本摘要。\n\n版本一旦发布就不再原地修改。任何更正都会形成新版本，因此旧摘要、公开版本和后续证明之间始终保持清晰的一一对应关系。\n\n这种设计不会把完整正文上传到链上。证明后端只接收最小必要标识与摘要，公开阅读仍由业务系统负责。`,
  `模块化 MVC 的重点不是创建更多目录，而是让业务事实只有一个明确的所有者。\n\nController 负责 HTTP 语义，Service 负责用例与事务，Repository 只服务本模块的数据访问。跨模块协作通过公开 Service 或稳定事件完成，不能直接读取其他模块的表。\n\n当资源发布需要校验分类与文件时，内容模块分别调用分类和文件模块的公开能力。发布事务只保存本地事实与可靠任务，不等待外部存证网络。\n\n这种结构保留单体部署的简单性，同时让代码边界、权限检查与失败恢复都更容易解释。`,
  `检索排序首先要回答一个朴素问题：为什么这个结果出现在这里？\n\n标题命中通常比正文中偶然出现一个词更重要，分类与标签能够表达稳定主题，完整摘要和清晰结构则可以作为质量信号。发布时间提供适度衰减，但不应该让旧的优质资源自动消失。\n\n互动数据需要去除异常后再参与排序，并且不能成为唯一指标。系统向普通读者展示主要排序信号，而把具体权重保留在受控的版本化配置中。`,
] as const;

const types = ["ARTICLE", "DOCUMENT", "VIDEO", "LINK"] as const;
const evidenceStatuses = ["CONFIRMED", "CONFIRMED", "PROCESSING", "PENDING"] as const;

export const mockPublishedResources: MockResourceDetail[] = titles.map((title, index) => {
  const user = mockUsers[(index + 1) % mockUsers.length];
  const resourceType = types[index % types.length];
  const idSuffix = String(index + 1).padStart(12, "0");
  const summary = `围绕“${title}”给出概念边界、工程步骤、常见误区与可检查结果，适合课程设计、系统实现和答辩演示使用。`;
  return {
    id: `30000000-0000-4000-8000-${idSuffix}`,
    slug: slugs[index],
    title,
    summary,
    resourceType,
    author: {
      id: user.user.id,
      handle: user.user.handle,
      displayName: user.user.displayName,
      avatarUrl: user.user.avatarUrl,
    },
    category: mockCategories[index % mockCategories.length],
    tags: [mockTags[index % mockTags.length], mockTags[(index + 3) % mockTags.length]],
    publishedAt: mockTimelineAt(index, titles.length),
    readingMinutes: 4 + (index % 9),
    evidenceStatus: evidenceStatuses[index % evidenceStatuses.length],
    versionId: `31000000-0000-4000-8000-${idSuffix}`,
    versionNumber: 1 + (index % 3 === 0 ? 1 : 0),
    body:
      openingBodies[index] ??
      `${title}需要同时说明目标、边界与验证方式，不能只给出零散结论。本文把主题拆成可以执行的步骤，并标注每一步产生的业务事实。\n\n首先建立清晰术语和输入条件，再描述正常流程、权限约束与失败恢复。这样读者既能理解设计理由，也能在自己的课程项目中复现。\n\n实现时应优先依赖稳定契约和模块公开能力，避免让页面、数据库或外部基础设施相互泄漏细节。关键写操作还需要留下版本、错误代码和审计线索。\n\n最后通过公开页面、管理视图与核验结果交叉检查。只有用户体验、接口行为和数据状态保持一致，完整闭环才真正成立。`,
    sourceUrl:
      resourceType === "VIDEO" || resourceType === "LINK"
        ? `https://resources.example.edu/${slugs[index]}`
        : "",
    copyrightStatement:
      index % 2 === 0
        ? "允许在保留作者、来源与版本信息的前提下用于非商业教学。"
        : "知识共享署名—非商业性使用 4.0 国际许可协议。",
    attachments: [],
    contentDigest: (index + 1).toString(16).padStart(64, "0"),
  };
});

import type { components } from "@educhain/api-contract";

import { mockBeforeHours, mockNow } from "@/mocks/clock";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type Source = components["schemas"]["ExternalContentSource"];
type Item = components["schemas"]["ExternalContentItem"];
type SourceWrite = components["schemas"]["ExternalContentSourceWriteRequest"];
type Quality = components["schemas"]["ExternalContentQualityStatus"];

type ExternalState = { sources: Source[]; items: Item[] };

const sourceDefinitions = [
  ["Open Learning Notes", "https://learning.example.edu/"],
  ["Open Course Lab", "https://courses.example.edu/"],
  ["Trusted Systems Classroom", "https://systems.example.edu/"],
  ["Accessible Learning Review", "https://accessibility.example.edu/"],
] as const;

const sources: Source[] = sourceDefinitions.map(([name, siteUrl], index) => ({
  id: `59000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name,
  siteUrl,
  feedUrl: `${siteUrl}educhain-feed.json`,
  enabled: index !== 3,
  syncStatus: index === 2 ? "FAILED" : "SUCCEEDED",
  lastSyncError: index === 2 ? "UPSTREAM_TIMEOUT" : null,
  lastSyncedAt: mockBeforeHours(6 + index * 14),
  version: 1,
  createdAt: mockBeforeHours(720 - index * 36),
  updatedAt: mockBeforeHours(6 + index * 14),
}));

const itemDefinitions = [
  [
    0,
    "从零理解可验证教育内容摘要",
    "以教学示例说明内容规范化、SHA-256 摘要和公开核验之间的边界。",
    "林知远",
    "APPROVED",
  ],
  [
    0,
    "课程资料开放许可检查清单",
    "发布课程讲义、视频和链接前可执行的署名、来源与许可检查方法。",
    "周予安",
    "APPROVED",
  ],
  [
    0,
    "结构化学习资源元数据实践",
    "介绍标题、摘要、作者与规范链接如何改善教育资源检索质量。",
    "周予安",
    "PENDING",
  ],
  [
    0,
    "内容版本冻结的课堂练习",
    "通过连续修订案例理解公开版本、摘要和证明记录之间的关系。",
    "许诺",
    "APPROVED",
  ],
  [
    1,
    "检索评测集的最小可行方案",
    "用相关性分级、查询集合和可重复指标建立课程级检索评测。",
    "陈默",
    "APPROVED",
  ],
  [
    1,
    "面向学习者的搜索筛选设计",
    "比较分类、标签、作者、类型与排序筛选在真实任务中的作用。",
    "李思涵",
    "APPROVED",
  ],
  [
    1,
    "课程项目中的 API 契约评审",
    "从状态码、错误模型、幂等和版本并发检查一份开放接口。",
    "吴承宇",
    "PENDING",
  ],
  [
    1,
    "如何写出可恢复的错误提示",
    "把服务端稳定错误码转换为清晰、可操作且不泄露敏感信息的界面反馈。",
    "高然",
    "REJECTED",
  ],
  [
    2,
    "可靠任务表与外部存证调用",
    "说明发布事务提交后如何异步调用证明后端并安全重试。",
    "唐一",
    "APPROVED",
  ],
  [
    2,
    "长安链教学网络接入要点",
    "梳理身份、网络、合约和交易回执在教学环境中的职责边界。",
    "孙启",
    "APPROVED",
  ],
  [
    2,
    "审计日志中的最小必要字段",
    "用操作者、目标、原因、请求标识和结果还原关键治理动作。",
    "唐一",
    "PENDING",
  ],
  [
    2,
    "摘要核验不是版权认定",
    "解释技术一致性、原创性、权属和法律效力之间不能混同的原因。",
    "林知远",
    "APPROVED",
  ],
  [
    3,
    "键盘完成资源发布流程",
    "逐步检查焦点顺序、可见焦点、表单标签和错误恢复。",
    "李思涵",
    "APPROVED",
  ],
  [
    3,
    "深色主题的对比度复核",
    "在不牺牲层级与品牌感的前提下验证文本、边框和状态颜色。",
    "高然",
    "PENDING",
  ],
  [
    3,
    "双语界面的长度与布局测试",
    "通过中英文长度差异检查导航、按钮、卡片和移动端换行。",
    "许诺",
    "APPROVED",
  ],
  [3, "可访问名称与图标按钮", "说明图标按钮如何提供稳定名称并避免重复朗读。", "李思涵", "REJECTED"],
] as const satisfies ReadonlyArray<readonly [number, string, string, string, Quality]>;

const seed: ExternalState = {
  sources,
  items: itemDefinitions.map(([sourceIndex, title, summary, authorName, qualityStatus], index) => {
    const source = sources[sourceIndex];
    const slug = `external-learning-resource-${String(index + 1).padStart(2, "0")}`;
    return {
      id: `59100000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceSiteUrl: source.siteUrl,
      canonicalUrl: `${source.siteUrl}resources/${slug}`,
      title,
      summary,
      authorName,
      qualityStatus,
      publishedAt: mockBeforeHours(80 + index * 21),
      fetchedAt: mockBeforeHours(10 + index * 9),
      version: 0,
    };
  }),
};

const storageKey = "educhain.mock.external-content.v2";
let state = structuredClone(seed);
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  state = readMockSession<ExternalState>(storageKey) ?? structuredClone(seed);
}

function persist() {
  writeMockSession(storageKey, state);
}

export const externalContentState = {
  publicItems(query = "") {
    hydrate();
    const normalized = query.trim().toLowerCase();
    const enabled = new Set(
      state.sources.filter((source) => source.enabled).map((source) => source.id),
    );
    return {
      items: state.items
        .filter((entry) => entry.qualityStatus === "APPROVED" && enabled.has(entry.sourceId))
        .filter(
          (entry) =>
            !normalized ||
            [entry.title, entry.summary, entry.authorName, entry.sourceName].some((value) =>
              value.toLowerCase().includes(normalized),
            ),
        )
        .sort((left, right) =>
          (right.publishedAt ?? right.fetchedAt).localeCompare(left.publishedAt ?? left.fetchedAt),
        ),
    };
  },
  sources() {
    hydrate();
    return { items: structuredClone(state.sources).sort((a, b) => a.name.localeCompare(b.name)) };
  },
  items(status?: Quality) {
    hydrate();
    return {
      items: structuredClone(state.items)
        .filter((entry) => !status || entry.qualityStatus === status)
        .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt)),
    };
  },
  createSource(request: SourceWrite) {
    hydrate();
    const now = mockNow();
    const source: Source = {
      id: crypto.randomUUID(),
      name: request.name.trim(),
      siteUrl: request.siteUrl,
      feedUrl: request.feedUrl,
      enabled: request.enabled,
      syncStatus: "NEVER_SYNCED",
      lastSyncError: null,
      lastSyncedAt: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    state.sources.push(source);
    persist();
    return structuredClone(source);
  },
  updateSource(sourceId: string, version: number, request: SourceWrite) {
    hydrate();
    const source = state.sources.find(
      (entry) => entry.id === sourceId && entry.version === version,
    );
    if (!source) return undefined;
    Object.assign(source, {
      name: request.name.trim(),
      siteUrl: request.siteUrl,
      feedUrl: request.feedUrl,
      enabled: request.enabled,
      version: source.version + 1,
      updatedAt: mockNow(),
    });
    persist();
    return structuredClone(source);
  },
  sync(sourceId: string) {
    hydrate();
    const source = state.sources.find((entry) => entry.id === sourceId && entry.enabled);
    if (!source) return undefined;
    source.syncStatus = "SUCCEEDED";
    source.lastSyncError = null;
    source.lastSyncedAt = mockNow();
    source.updatedAt = source.lastSyncedAt;
    source.version += 1;
    persist();
    const fetched = state.items.filter((item) => item.sourceId === sourceId).length;
    return {
      source: structuredClone(source),
      fetched,
      inserted: 0,
      updated: fetched,
      duplicates: 0,
    };
  },
  review(itemId: string, version: number, qualityStatus: Quality) {
    hydrate();
    const entry = state.items.find((item) => item.id === itemId && item.version === version);
    if (!entry) return undefined;
    entry.qualityStatus = qualityStatus;
    entry.version += 1;
    persist();
    return structuredClone(entry);
  },
};

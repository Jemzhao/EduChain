# 前端架构与目录蓝图

- 状态：Accepted

## 1. 架构目标

- 同一 Next.js 应用覆盖公开站点、用户工作区与管理后台。
- 服务端组件负责公开页面首屏与 SEO，客户端组件只承担需要交互的局部。
- 功能模块拥有自己的组件、请求、模型和局部内容；全局能力集中治理。
- Mock 与真实后端通过相同 HTTP 客户端和契约运行。
- 页面不成为业务逻辑仓库，基础组件不感知具体业务模块。

## 2. 目标目录

```text
apps/web/
  public/
    brand/
    illustrations/
  src/
    app/
      [locale]/
        (public)/
        (auth)/
        (workspace)/
        admin/
      api/
      error.tsx
      global-error.tsx
      not-found.tsx
      robots.ts
      sitemap.ts
    components/
      primitives/
      patterns/
      feedback/
      layout/
    features/
      auth/
      profile/
      resources/
      studio/
      search/
      interactions/
      social/
      notifications/
      evidence/
      admin/
        components/
          admin-sections/
    content/
      global/
      navigation/
      validation/
      errors/
      metadata/
    contracts/
      generated/
      schemas/
    data-access/
      http/
      queries/
      mutations/
    mocks/
      browser.ts
      node.ts
      handlers/
      fixtures/
      state/
    styles/
      tokens/
      globals.css
      typography.css
    lib/
      auth/
      env/
      observability/
      formatting/
    hooks/
    types/
    test-support/
  intlayer.config.ts
  next.config.ts
```

该目录是当前实现的结构基线。路由、功能、数据访问和 Mock 均已按此边界落地；新增目录必须能归入同一依赖方向。

## 3. 目录职责

### 3.1 `app`

- 负责路由、布局、元数据、边界状态和数据装配。
- 页面文件保持薄，不定义可复用业务规则。
- 路由组表达页面壳层，不作为权限唯一依据。

### 3.2 `components`

- `primitives`：Button、Input、Dialog、Tabs、Tooltip 等低层组件。
- `patterns`：PageHeader、FilterBar、DataTable、EmptyState、FormSection 等组合模式。
- `feedback`：Toast、InlineAlert、ErrorSummary、ProgressState。
- `layout`：Header、Sidebar、Shell、Container、Stack、Grid。

基础组件不得导入 `features`。

### 3.3 `features`

每个业务功能包含所需的 `components`、`content` 和局部模型；跨功能请求统一进入 `data-access/queries` 与 `data-access/mutations`。模块只能通过稳定入口向外暴露能力，禁止无约束的跨模块深层引用。

复杂功能应继续按用例拆分。例如管理工作台由薄入口负责权限和分区选择，用户、内容、分类、存证、支持、外部内容与运维视图分别位于 `admin-sections`；创作编辑器将加载边界、状态 Hook 和展示组件分开。

### 3.4 `data-access`

- 统一基础 URL、认证、超时、请求标识、错误转换和响应校验。
- Query 与 Command 分开组织，便于缓存和副作用审查。
- 页面和组件不直接调用原始 `fetch`。

### 3.5 `content`

只放跨页面或跨功能使用的内容字典。功能独有内容跟随功能模块，避免形成无法维护的巨大单文件。

## 4. 依赖方向

```text
app -> features -> components
app -> data-access -> contracts
features -> data-access -> contracts
features -> components
features -> content/global
mocks -> contracts
mocks -> fixtures
components -X-> features
contracts -X-> features
```

## 5. 渲染策略

- 首页、分类页、资源详情、创作者主页和证明公示页：服务端渲染或静态生成优先。
- 搜索页：服务端提供可索引首屏，筛选和分页在客户端增强。
- 创作中心、收藏、通知、设置和管理后台：动态渲染，客户端交互为主。
- 只有需要浏览器 API、事件处理或本地交互状态的组件才声明为客户端组件。

## 6. 状态管理

- URL：搜索词、筛选、排序、分页和可分享视图状态。
- 服务端数据：服务端 Fetch 或 TanStack Query。
- 表单状态：React Hook Form。
- 短期组件状态：React 本地状态。
- 全局 UI 状态：仅限主题、导航展开和全局浮层等少数能力。
- 认证事实从服务端会话获取，不以浏览器全局状态作为唯一来源。

## 7. 错误模型

前端只消费统一错误结构：错误代码、用户消息键、字段错误、请求标识、是否可重试和必要的上下文。组件不解析后端原始异常文字。

## 8. 防重复规则

- 用户可见文案进入 Intlayer。
- 日期、数字、文件大小和相对时间使用统一格式化器。
- 按钮、输入、对话框、空状态和表格只保留一个权威实现。
- API 请求统一由数据访问层构造。
- 权限展示使用统一能力判断器，但服务端仍执行最终授权。
- 页面间共享的加载、错误和空状态使用模式组件。
- 路由 `page.tsx` 默认不超过 100 行，功能组件默认不超过 450 行；内容语料文件不按组件预算计算。
- 单个 Mock handler 或 state 文件默认不超过 450 行；权限守卫、持久化存储、种子数据和业务状态切片分别维护。
- 非 Mock 模块不得静态导入 `mocks`，仅允许浏览器和服务端的显式 Mock 启动边界。

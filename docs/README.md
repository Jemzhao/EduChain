# EduChain 文档总览

## 阅读顺序

| 序号 | 主题       | 核心问题                                    | 文档               |
| ---- | ---------- | ------------------------------------------- | ------------------ |
| 00   | 项目基础   | 为什么做、做什么、不做什么、质量到什么程度  | `00-foundation/`   |
| 01   | 产品定义   | 谁使用、完成什么任务、有哪些页面与权限      | `01-product/`      |
| 02   | 系统架构   | 系统如何拆分、技术如何选、服务如何协作      | `02-architecture/` |
| 03   | 前端蓝图   | 目录、设计系统、国际化、Mock/真实后端模式   | `03-frontend/`     |
| 04   | Java 后端  | 模块化 MVC、接口、数据、事务与模块边界      | `04-backend/`      |
| 05   | 区块链存证 | 存证模型、网关、长安链与本地模拟器          | `05-evidence/`     |
| 06   | 数据设计   | 核心实体、关系、约束、生命周期              | `06-data/`         |
| 07   | 契约       | REST API、错误码、事件、Mock 数据的唯一依据 | `07-contracts/`    |
| 08   | 运行保障   | 环境、配置、日志、指标、安全与质量门禁      | `08-operations/`   |
| 09   | 实施计划   | 构建顺序、里程碑、风险、验收与完成标准      | `09-delivery/`     |
| 10   | 架构决策   | 关键选择、备选方案与后果                    | `10-decisions/`    |

## 文档状态

每份文档使用以下状态之一：

- `Draft`：内容已形成，可讨论，尚未批准。
- `Review`：进入正式评审，不应随意扩大范围。
- `Accepted`：作为实现依据，变更必须补充决策记录。
- `Superseded`：已有新文档替代，但保留决策轨迹。

产品、架构、契约与工程基线已作为当前实现依据。实现核验记录使用 `Review`，直到完成独立验收后再进入 `Accepted`。以下内容构成当前冻结基线：

1. 产品范围与非目标。
2. 角色权限矩阵。
3. 页面信息架构。
4. 技术基线与兼容性。
5. 前端 Mock/真实后端双模式。
6. 全局内容和国际化治理。
7. Java 模块化 MVC 边界。
8. API 契约、错误模型和幂等规则。
9. 存证状态机与失败补偿。
10. 数据模型、安全模型、质量门禁和里程碑。
11. 模块边界、结构预算与自动防回退规则。

## 文档变更规则

- 一个结论只能有一个权威文档，其他文档只链接，不复制完整规则。
- 版本、端口、环境变量、错误码和状态枚举必须在权威位置定义。
- 需求使用稳定编号，例如 `FR-KNOWLEDGE-001`；质量要求使用 `NFR-PERF-001`；架构决策使用 `ADR-0001`。
- 文档中的“必须”表示发布阻断条件；“应当”表示默认遵守，偏离时需要说明；“可以”表示可选能力。
- 新增功能必须同时补齐需求编号、权限、接口、数据、失败状态、验收条件和观测指标。

## 已建立的工程根目录

```text
apps/
  web/
  server/
  evidence-gateway/
packages/
  api-contract/
  design-tokens/
docs/
```

`apps/web`、`apps/server` 和 `apps/evidence-gateway` 是三个独立应用；`packages/api-contract` 与 `packages/design-tokens` 提供全局契约和设计事实来源。运行手册、交付核验、全量功能覆盖矩阵和项目时间口径分别位于 `08-operations/02-runtime-runbook.md`、`09-delivery/04-implementation-verification.md`、`09-delivery/05-feature-coverage-matrix.md` 和 `09-delivery/06-project-period-and-demo-data.md`。

当前模块边界和自动结构门禁由 `10-decisions/ADR-0005-module-boundaries-and-structure-gates.md` 说明，根目录 `scripts/check-architecture.mjs` 是对应的可执行检查。

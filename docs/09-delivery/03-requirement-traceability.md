# 需求追踪矩阵

- 状态：Complete

本矩阵确保需求不会只停留在产品描述中。HTTP 路径与 operationId 以 `packages/api-contract/openapi/openapi.yaml` 为准，数据结构以 `apps/server/src/main/resources/db/version/` 为准，静态核验证据以 `04-implementation-verification.md` 为准。

| 需求组            | 页面或入口                                 | Java 模块                                   | 主要数据                                                 | 契约端点族                                                              | Mock 场景                              | 完成条件                                         |
| ----------------- | ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| `FR-AUTH-*`       | 登录、注册、密码找回、会话与安全设置       | auth、user                                  | user_account、auth_credential、refresh_session           | `/auth/*`                                                               | 成功、凭据错误、受限、过期、限流       | 会话轮换、撤销、防枚举和 CSRF 语义一致           |
| `FR-PROFILE-*`    | 本人设置、创作者主页                       | user、file                                  | user_profile、file_object                                | `/users/*`、`/files/*`                                                  | 空资料、长文本、头像失败、不可见用户   | 公开字段与内部字段严格分离                       |
| `FR-KNOWLEDGE-*`  | 创作中心、编辑、预览、资源详情             | knowledge、file、taxonomy                   | knowledge_resource、knowledge_draft、knowledge_version   | `/resources/*`、`/uploads/*`                                            | 自动保存、冲突、附件处理中、发布失败   | 发布生成不可变版本，草稿和主动下架生命周期完整   |
| `FR-DISCOVERY-*`  | 首页、发现、分类、活动                     | search、knowledge、taxonomy、recommendation | search_event、resource_view、recommendation_feedback     | `/search/*`、`/recommendations/*`、`/users/me/history`                  | 无结果、未知筛选、推荐反馈、目标不可见 | 检索稳定、推荐可解释、浏览与反馈可追踪           |
| `FR-SOCIAL-*`     | 资源详情、收藏、创作者主页                 | interaction、social                         | resource_like、collection、comment、follow_relation      | `/resources/*/like`、`/collections/*`、`/comments/*`、`/users/*/follow` | 未登录、重复、目标下架、评论关闭       | 关系唯一、权限和计数一致                         |
| `FR-COMMUNITY-*`  | 社区、成就、贡献排行                       | community、achievement                      | community_event、achievement_progress、contributor_score | `/community`、`/achievements`、`/leaderboards/*`                        | 空动态、未解锁、排行为空               | 公开聚合与本人进度边界明确                       |
| `FR-NOTIFY-*`     | 通知中心、通知设置                         | notification                                | notification、notification_preference                    | `/notifications/*`、`/notification-preferences`                         | 空、未读、批量失败、偏好关闭           | 去重、已读、事件偏好和系统通知正确               |
| `FR-EVIDENCE-*`   | 证明摘要、公示、核验、证书、链浏览器       | evidence、knowledge、file                   | evidence_job、evidence_record、certificate_artifact      | `/evidence/*`、`/verifications`、`/ledger/*`                            | 全部任务状态、匹配、不匹配、模拟来源   | 幂等、来源明确，证明、交易和摘要核验语义准确     |
| `FR-GOVERNANCE-*` | 管理后台                                   | admin + 目标模块 + audit                    | 目标业务表、audit_event                                  | `/admin/*`                                                              | 无权限、对象冲突、原因缺失、操作成功   | 用户、内容、评论、举报、分类标签、证明与审计闭环 |
| `FR-PLATFORM-*`   | 管理统计、设置、维护                       | admin、maintenance、notification            | platform_setting、maintenance_job、statistics_projection | `/admin/statistics*`、`/admin/settings*`、`/admin/maintenance-jobs`     | 非法配置、运行冲突、导出、通知发布     | 所有高风险动作都有边界、原因、结果和审计         |
| `FR-SUPPORT-*`    | 支持中心、管理工单                         | support                                     | support_ticket、support_message                          | `/support/*`、`/admin/support-tickets/*`                                | 空列表、追加回复、非法状态、关闭工单   | 本人与管理员可见性严格隔离，状态流转受控         |
| `FR-EXTERNAL-*`   | 外部内容、来源与审核                       | externalcontent                             | external_source、external_item                           | `/external-content`、`/admin/external-content/*`                        | 来源停用、同步失败、重复内容、审核     | 受控抓取、去重、来源归属和公开状态完整           |
| `FR-INFO-*`       | 帮助、指南、开发者、法律、关于、联系、合作 | Web 信息模块                                | 版本化内容字典                                           | 页面路由，无写接口                                                      | 中英文、未知页面、无脚本环境           | 内容边界清楚、国际化完整、不出现虚构组织数据     |

## 非功能追踪

| 要求组        | 设计依据               | 实现检查                                     | 静态证据                          |
| ------------- | ---------------------- | -------------------------------------------- | --------------------------------- |
| `NFR-SEC-*`   | 安全与隐私架构         | 授权、Cookie、CSP、上传、限流、秘密管理      | Java 编译、配置解析和安全配置审阅 |
| `NFR-PERF-*`  | 质量基线性能预算       | 批量聚合、游标、异步任务、派生投影、资源预算 | 生产构建和查询边界审阅            |
| `NFR-A11Y-*`  | 设计系统与页面完成定义 | 语义、焦点、键盘、对比度、减少动效           | ESLint、TypeScript 和组件审阅     |
| `NFR-OBS-*`   | 环境与可观测性         | 请求标识、结构化日志、指标、追踪、健康       | Java 编译与运维配置审阅           |
| `NFR-MAINT-*` | 模块化 MVC 与契约规范  | 依赖规则、静态检查、生成契约、文档同步       | OpenAPI、编译、类型与格式检查     |
| `NFR-I18N-*`  | Intlayer 内容治理      | 语言键一致、无业务硬编码、区域格式、SEO      | Intlayer 参与生产构建             |

## 追踪规则

- 新需求必须先增加矩阵条目，再进入实现。
- 页面删除或合并时同步更新对应需求，不留下无入口接口。
- 接口字段变化时同步检查 Mock、数据模型、错误内容和国际化内容。
- 业务状态变化时同步检查页面状态、任务状态、指标和审计。
- 一个静态证据可以覆盖多个需求，但必须明确说明适用范围。

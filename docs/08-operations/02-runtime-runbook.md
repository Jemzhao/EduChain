# 运行、部署与故障处理手册

- 状态：Accepted

## 1. 应用与依赖

| 进程             | 默认端口 | 事实来源                             | 健康入口                                                  |
| ---------------- | -------- | ------------------------------------ | --------------------------------------------------------- |
| Web              | `3000`   | Intlayer、OpenAPI 生成类型、设计令牌 | 页面与 `/api/v1/health`                                   |
| Java Server      | `8080`   | MySQL 业务事实、Redis 限流与短期状态 | `/actuator/health/liveness`、`/actuator/health/readiness` |
| Evidence Gateway | `8081`   | 模拟器或长安链、证书制品             | `/health`                                                 |
| MySQL            | `3306`   | 业务数据与只追加审计                 | 容器健康检查                                              |
| Redis            | `6379`   | 限流计数与可重建状态                 | 容器健康检查                                              |

## 2. 本地运行

完整联调环境从根目录执行：

```bash
docker compose up --build
```

该编排固定使用 Remote Web、Java Server、本地模拟器、MySQL 和 Redis。界面右下角显示“真实服务”，资源证明区域继续明确显示“本地模拟器（非真实链）”，两类来源不会混淆。

纯 Web 评审可复制 `apps/web/.env.example`，保留 `NEXT_PUBLIC_API_MODE=mock`。切换到 Java Server 时改为 `remote`，业务页面不需要修改。真实模式会主动注销同一来源下残留的 Mock Service Worker，避免两种数据源交叉接管请求。本地 Java CORS 默认同时接受 `localhost:3000` 与 `127.0.0.1:3000`；其他来源必须显式加入白名单。

## 3. 环境保护

- Web 的 `EDUCHAIN_DEPLOYMENT_ENV` 不是 `local` 时，Mock 构建直接失败。
- Java 的 `EDUCHAIN_DEPLOYMENT_ENVIRONMENT=PRODUCTION_LIKE` 要求安全 Cookie、明确的 HTTPS CORS 来源和 `CHAINMAKER` 后端。
- Gateway 的 `EDUCHAIN_EVIDENCE_DEPLOYMENT_ENVIRONMENT=production-like` 禁止 `simulator`。
- Remote 容器制品不携带 Mock Service Worker。
- Server 与 Gateway 的服务令牌、作者伪名密钥、会话密钥和长安链证书必须由秘密管理注入，不能使用示例值。

## 4. 长安链接入

Gateway 的业务接口不因证明后端改变。启用长安链需要设置 `EDUCHAIN_EVIDENCE_MODE=chainmaker`，并注入链标识、组织标识、节点地址、TLS 主机名、信任根、签名证书与密钥、TLS 证书与密钥、合约名和方法名。

适配器只在 `adapters/chainmaker` 内加载官方 SDK；Java Server 不接触 SDK 类型或链私钥。同一资源版本使用稳定幂等键，提交超时进入“结果未知”，后续先查询既有交易，不直接重复提交。

## 5. 证书字体与制品

Gateway 容器包含文泉驿正黑字体，用于稳定渲染中英文证书。非容器运行可通过 `EDUCHAIN_EVIDENCE_CERTIFICATE_FONT_PATH` 指定支持中文的 TrueType 字体。证书与清单写入独立持久卷；证明已确认与证书已生成是两个不同状态。

## 6. 安全运行基线

- Web 正式响应启用 CSP、HSTS、防嵌入、内容类型保护、来源策略和能力策略；本地开发不启用会破坏热更新的正式 CSP。
- Java 使用 Cookie 会话、CSRF 双提交、Argon2id、服务端对象权限、最小 CORS 白名单和 Redis 原子限流。
- 登录注册、公开核验和其他写操作使用不同限流额度；Redis 短暂不可用时记录指标并保留核心业务可用性。
- 上传先写隔离路径，检查大小、声明类型和文件签名后才进入可用状态。
- 管理动作需要最少长度的原因，并产生不可编辑审计记录。

## 7. 可观测性

Java 的 `/actuator/prometheus` 提供 JVM、HTTP、连接池、限流、认证、发布、搜索、业务错误和存证指标。Gateway 的 `/metrics` 需要 `X-Service-Token`，提供按路由模板聚合的请求数与耗时总量。

三应用使用 `X-Request-Id` 关联请求。访问日志只记录方法、路由模板、状态和耗时，不记录查询词、正文、令牌、Cookie、文件内容或私钥。管理健康页只展示业务能力状态，不暴露原始日志和内部堆栈。

## 8. 故障处理顺序

1. 先使用请求标识关联 Web、Server 与 Gateway 日志。
2. 检查 Java readiness、数据库连接池、Redis 和 Gateway 健康。
3. 存证提交超时按“结果未知”处理，先查幂等键，禁止人工直接新建交易。
4. 证书失败只重试证书步骤，不改变已确认的证明事实。
5. 管理后台的人工重试保留原幂等键，并形成审计记录。
6. 模拟器与真实链的故障说明必须保留来源标签，不允许静默切换。

## 9. 备份与恢复

- MySQL 使用一致性备份与日志恢复，恢复后核对资源、公开版本、文件引用、可靠任务和证明记录。
- `server-files` 与 `evidence-data` 使用独立版本化备份；证书可根据已确认证明重新生成，但原始资源附件不可仅依赖数据库恢复。
- Redis 不作为业务事实唯一来源，故障后允许重建限流和短期状态。
- 恢复演练以公开资源可读、附件引用一致、证明可核验、审计连续为完成条件。

## 10. 停止与清理

普通停止使用 `docker compose down`，持久卷默认保留。删除卷会不可恢复地移除本地数据库、上传文件、模拟证明和证书，只能在明确需要重置本地演示数据时由操作者单独执行。

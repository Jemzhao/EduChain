# 技术基线与版本策略

- 状态：Accepted

## 1. 选型原则

- 保持论文的核心语言、框架和基础设施路线。
- 新系统只采用当前仍受维护的版本线。
- 主运行时和主框架锁定明确版本，普通库锁定兼容版本范围与锁文件。
- 生产版本不得自动追随 `latest`；依赖更新需要发布说明、安全信息和兼容性评估。
- 尽量减少同类库并存，一个问题只选择一个默认方案。

## 2. Web 技术基线

| 类别     | 选择                        | 基线                     | 用途与说明                                        |
| -------- | --------------------------- | ------------------------ | ------------------------------------------------- |
| 运行时   | Node.js                     | 24 LTS，使用最新安全补丁 | 论文使用的 18 已停止维护，24 是当前 LTS           |
| 包管理   | pnpm                        | 10.x                     | 严格依赖、工作区与稳定锁文件                      |
| 框架     | Next.js                     | 16.3.3                   | 当前 Active LTS 安全版本，使用 App Router         |
| UI       | React                       | 19.2.x                   | 与 Next.js 16 配套                                |
| 语言     | TypeScript                  | 5.9.x                    | 保持论文技术路线，开启严格规则                    |
| 样式     | Tailwind CSS                | 4.x                      | 设计令牌驱动，不把工具类当设计系统                |
| 国际化   | Intlayer                    | 9.4.1                    | 类型安全内容、按组件字典、静态渲染与 Next.js 集成 |
| 数据请求 | 原生 Fetch + TanStack Query | Query 5.x                | 服务端读取优先，客户端缓存仅用于交互型数据        |
| 契约校验 | Zod                         | 4.x                      | 环境变量、表单和外部响应边界校验                  |
| Mock     | MSW                         | 2.x                      | 浏览器与 Node 环境拦截同一 HTTP 契约              |
| 图标     | Lucide React                | 锁定版本                 | 单一线性图标体系，不混用多套图标                  |
| 表单     | React Hook Form             | 7.x                      | 复杂表单状态与可访问错误联动                      |

### 2.1 明确不选

- 不引入第二套国际化框架。
- 不同时使用多个客户端状态库。
- 不使用大型全量组件库统一替代产品设计系统。
- 不在首版引入 GraphQL。
- 不在组件内部直接使用 Axios 实例或拼接 URL。

## 3. Java 技术基线

| 类别           | 选择                             | 基线                     | 用途与说明                         |
| -------------- | -------------------------------- | ------------------------ | ---------------------------------- |
| JDK            | Eclipse Temurin Java             | 21 LTS                   | 与论文一致，避免绑定单一商业发行版 |
| 框架           | Spring Boot                      | 4.1.1                    | 当前稳定受支持版本                 |
| Web            | Spring MVC                       | 随 Boot 管理             | 标准 Servlet MVC，不采用响应式主栈 |
| 安全           | Spring Security                  | 随 Boot 管理             | 认证、授权、密码、方法安全         |
| 数据访问       | Spring Data JPA                  | 随 Boot 管理             | 聚合持久化与分页查询               |
| 校验           | Jakarta Validation               | 随 Boot 管理             | HTTP 边界和业务命令校验            |
| 数据库版本管理 | Flyway                           | 随 Boot 兼容线           | 数据结构版本、校验和与环境一致性   |
| 映射           | MapStruct                        | 1.6.x                    | DTO 与 Entity 的显式编译期映射     |
| API 文档       | OpenAPI 3.1                      | 生成器采用 Boot 4 兼容线 | 公开契约来源                       |
| 构建           | Maven                            | 3.9.x                    | 可重复构建与依赖治理               |
| 测试           | JUnit 5、AssertJ、Testcontainers | 随兼容线                 | 后续实现阶段使用                   |

### 3.1 Java 规则

- 使用模块化 MVC 单体，不使用微服务、CQRS 或通用事件总线作为默认结构。
- DTO 优先使用不可变对象或 `record`；Entity 不使用 `record`。
- 不使用 Lombok 生成核心业务行为，减少隐式代码和调试成本。
- 不把 Map 作为常规 API 请求或响应模型。
- 时间统一使用 UTC 存储，通过 `Instant` 表达绝对时间。

## 4. 数据与基础设施

| 类别           | 选择                    | 基线         | 说明                                    |
| -------------- | ----------------------- | ------------ | --------------------------------------- |
| 关系数据库     | MySQL                   | 8.4 LTS      | 延续论文 MySQL 8 路线，使用长期支持线   |
| 缓存与检索辅助 | Redis Open Source       | 8.2 Extended | 长支持版本；核心事实不得只存 Redis      |
| 对象存储       | S3 兼容接口             | 协议稳定线   | 本地使用 MinIO 或文件适配器，线上可替换 |
| 容器           | Docker Compose          | 当前稳定     | 本地环境与演示环境编排                  |
| 指标           | Micrometer + Prometheus | 兼容线       | Java 服务指标                           |
| 追踪           | OpenTelemetry           | 兼容线       | 跨 Web、Server、Gateway 追踪            |
| 日志           | JSON 结构化日志         | 统一字段规范 | 支持关联与脱敏                          |

## 5. 存证网关技术基线

| 类别       | 选择           | 基线               | 说明                                     |
| ---------- | -------------- | ------------------ | ---------------------------------------- |
| Python     | CPython        | 3.12.x             | 满足 FastAPI 与长安链 SDK 的保守兼容选择 |
| Web        | FastAPI        | 0.137.1            | 维护中的稳定版本                         |
| 模型       | Pydantic       | 2.x                | 请求、配置和响应校验                     |
| 服务器     | Uvicorn        | 兼容稳定线         | ASGI 运行                                |
| 长安链     | chainmaker-go  | 2.3.6              | 论文同一 2.3 系列                        |
| Python SDK | sdk-python     | 2.3.2              | 官方版本映射中的 Python SDK 版本         |
| PDF        | 受控证书生成库 | 选型评审后锁定     | 字体嵌入、二维码与确定性输出             |
| 哈希       | SHA-256        | 标准算法           | 文件和规范化内容摘要                     |
| 聚合证明   | Merkle Tree    | 明确定义叶子和排序 | 多附件摘要聚合                           |

Python 与长安链 SDK 的组合在真实链部署环境执行最小兼容性核对；核对只决定适配器配置，不改变网关边界。

## 6. 官方依据

- Next.js 16.3.3 是当前 Active LTS 安全版本：<https://nextjs.org/blog>
- Node.js 官方要求生产应用使用 Active LTS 或 Maintenance LTS，24 当前为 LTS：<https://nodejs.org/en/about/previous-releases>
- Intlayer 当前包版本为 9.4.1，并提供 Next.js 16 集成：<https://www.npmjs.com/package/intlayer>、<https://intlayer.org/en-GB/doc/environment/nextjs>
- Spring Boot 当前稳定文档列出 4.1.1；3.5.16 已是 3.5 系列最后一个开源支持版本：<https://docs.spring.io/spring-boot/>
- MySQL 8.4 是官方 LTS 系列：<https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html>
- Redis 8.2 是 Extended 支持线：<https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/>
- FastAPI 版本记录与支持要求：<https://fastapi.tiangolo.com/release-notes/>
- 长安链 2.3 系列版本映射：<https://docs.chainmaker.org.cn/instructions/%E7%89%88%E6%9C%AC%E8%BF%AD%E4%BB%A3%E8%AF%B4%E6%98%8E.html>

## 7. 版本锁定策略

- 运行时主版本写入工具版本文件，容器镜像使用明确补丁标签和摘要。
- Java 依赖优先使用 Spring Boot BOM 管理，不重复声明受管版本。
- JavaScript 依赖提交锁文件，CI 使用冻结锁文件安装。
- Python 使用锁定文件和哈希校验。
- 安全补丁可以在同一兼容线内快速更新；主版本变化必须新增 ADR。

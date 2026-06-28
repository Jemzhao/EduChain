# Java 模块化 MVC 蓝图

- 状态：Accepted

## 1. 架构定义

Java Server 是一个模块化 MVC 单体。代码按业务模块组织，每个模块内部保持标准的 Controller → Service → Repository → Entity 分层。

它不是微服务，不使用 DDD 术语包装普通 CRUD，也不把整个系统改造成多层六边形架构。仅当两个业务模块需要双向协作时，使用 `platform/port` 中的窄接口和 `platform/contract` 中的稳定快照解除实现依赖；普通模块内调用仍保持清晰的 MVC 分层。

## 2. 目标目录

```text
apps/server/
  src/main/java/com/educhain/
    EduChainApplication.java
    shared/
      api/
      config/
      error/
      pagination/
      time/
      validation/
      observability/
    platform/
      contract/
      port/
      security/
    auth/
      controller/
      service/
      repository/
      domain/
      entity/
      dto/
      mapper/
    user/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    knowledge/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    taxonomy/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    search/
      controller/
      service/
      repository/
      dto/
    interaction/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    social/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    notification/
      controller/
      service/
      repository/
      entity/
      dto/
      mapper/
    file/
      controller/
      service/
      repository/
      entity/
      dto/
      storage/
    evidence/
      controller/
      service/
      repository/
      entity/
      dto/
      client/
      mapper/
    admin/
      controller/
      service/
      dto/
    audit/
      service/
      repository/
      entity/
    job/
      service/
      repository/
      entity/
      worker/
  src/main/resources/
    db/version/
    application.yml
    application-local.yml
  src/test/java/com/educhain/
```

目录树是当前实现的结构约束。各业务模块可以按实际用例增减子目录，但 `domain`、`entity`、`dto`、`repository`、`service` 和 `controller` 的职责不得混用。

## 3. 分层职责

### 3.1 Controller

- 定义 HTTP 路由、方法、状态码和媒体类型。
- 接收认证主体、路径、查询和请求 DTO。
- 触发 Bean Validation。
- 调用单一清晰的 Service 方法。
- 将结果包装为标准响应或直接返回响应 DTO。
- 不编写业务规则、不访问 Repository、不控制事务。

### 3.2 Service

- 业务用例入口和事务边界。
- 执行对象级授权、状态转换、不变量和幂等判断。
- 协调本模块 Repository 与受控的其他模块门面。
- 生成审计意图、任务记录和通知意图。
- 返回业务结果 DTO 或内部结果对象。

### 3.3 Repository

- 负责 Entity 的持久化和查询。
- 查询方法表达业务语义与可见性条件。
- 复杂列表使用投影或专用查询对象，避免无界加载。
- 不包含授权决定、状态机和 HTTP 语义。

### 3.4 Entity

- 表达持久化状态、核心约束和必要状态变化方法。
- 不直接作为 HTTP 输入输出。
- 关系默认谨慎加载，避免隐式的大对象图。
- 等值与哈希规则不得依赖可变关系集合。

### 3.5 DTO

- 按请求、响应和内部调用用途命名。
- 请求 DTO 包含结构校验，不承载数据库注解。
- 响应 DTO 只暴露该用例允许公开的字段。
- 创建、更新、列表项、详情和管理视图使用不同 DTO。

### 3.6 Mapper

- 使用 MapStruct 完成明确的字段映射。
- 权限、状态机、查询和外部调用不放入 Mapper。
- 敏感字段默认不映射，新增字段不会自动暴露。

## 4. 模块依赖规则

- 模块不能直接访问另一个模块的 Repository。
- 单向模块协作通过对方公开 Service 门面和专用内部 DTO。
- 双向协作必须收敛到 `platform/port` 的窄接口；接口参数和返回值使用 `platform/contract` 的稳定快照，不得互相注入具体 Service。
- 公共技术能力放入 `shared`，业务概念不得因为“复用”进入 `shared`。
- `admin` 编排治理用例，但用户、资源和评论状态仍由各自模块 Service 修改。
- `job` 负责通用领取机制，具体任务处理器留在业务模块。
- `audit` 提供只追加的审计记录能力，不反向依赖业务模块。

## 5. 允许的调用方向

```text
Controller -> Service -> Repository -> Entity
Service -> Mapper
Service -> AnotherModulePublicService
Service -> PlatformPort
Service -> SharedTechnicalCapability
Worker -> Service
Repository -X-> Service
Entity -X-> Repository
Shared -X-> BusinessModule
```

## 6. 事务规则

- 事务注解放在 Service 公共用例方法。
- 读取用例声明只读事务。
- 外部 HTTP、对象存储大文件操作和长安链调用不在数据库事务内执行。
- 更新使用乐观锁或明确条件更新处理并发。
- 异步副作用通过可靠任务记录衔接。
- 捕获异常后不得在已标记回滚的事务里继续写入“成功”状态。

## 7. 状态机归属

- 资源状态：`knowledge` 模块。
- 文件状态：`file` 模块。
- 证明任务与证明记录状态：`evidence` 模块。
- 用户状态：`user` 模块。
- 评论治理状态：`interaction` 模块。
- 通用任务领取状态：`job` 模块。

状态改变只通过对应 Service 用例完成，Controller 和定时任务不得直接改 Entity 字段。

## 8. 异常与错误

- 业务异常包含稳定错误代码、HTTP 分类和可安全公开的参数。
- 全局异常处理器统一转换为 Problem Details 风格响应。
- 未预期异常只返回通用错误代码与请求标识。
- 数据库唯一约束和乐观锁异常转换为明确业务错误，不把 SQL 信息返回前端。

## 9. 防止常见失控

- 单个 Service 超过合理职责时按用例拆分，不创建万能 `CommonService`。
- Controller 默认不超过 300 行，Service 默认不超过 500 行；超过预算必须拆分职责或在架构决策中解释。
- API DTO 只能依赖领域类型或稳定契约，禁止 import `entity` 与 `repository`。
- `shared` 只提供底层技术能力，不得依赖业务模块；安全装配、运行环境校验等组合根能力位于 `platform`。
- 管理后台按用户、内容、分类、存证、可观测性等用例拆分 Controller 和 Service，共享响应映射集中到专用 Mapper。
- 不创建通用 `BaseController`、`BaseService` 和 `BaseRepository` 来隐藏重要行为。
- 不把所有关联都设置为级联保存或急加载。
- 不在 Entity 生命周期回调中调用外部服务。
- 不用数据库触发器实现核心业务状态机。
- 不让管理接口通过布尔参数复用普通用户接口。

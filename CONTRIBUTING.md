# 参与贡献

感谢你关注 EduChain。项目欢迎缺陷修复、文档改进、可访问性优化、测试补充和经过讨论的功能增强。

## 开始之前

- 阅读 [README.md](README.md) 与 [架构文档](docs/README.md)，确认改动符合项目边界。
- 较大的功能、数据结构或公共接口调整，应先创建 Issue 说明目标、范围与替代方案。
- 安全问题不要提交公开 Issue，请遵循 [SECURITY.md](SECURITY.md)。
- 参与项目即表示你同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 本地环境

完整联调只要求 Docker；单独开发各应用时使用以下环境：

- Node.js 24 与 pnpm 10
- Java 21
- Python 3.12
- Docker 与 Docker Compose

安装 Web 工作区依赖：

```bash
corepack enable
pnpm install --frozen-lockfile
```

启动 Mock Web：

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

启动完整本地栈：

```bash
docker compose up --build
```

## 架构约束

- `apps/web` 的页面保持薄层，业务逻辑放在对应 feature 与 data-access 中。
- Mock 和 Remote 必须共享 OpenAPI 路径、方法、请求模型、响应模型与错误语义。
- 用户可见文案进入 Intlayer 内容声明，同时维护中文和英文。
- Java Controller 只处理 HTTP 边界，Service 负责用例与事务，Repository 只服务所属模块。
- DTO 不引用持久化 Entity，跨模块双向协作使用窄端口和稳定快照。
- Evidence Gateway 的 application 层不依赖 API 或 adapter 实现。
- 新增接口必须同步更新 OpenAPI、生成类型、Web/Mock、Java 与相关文档。

详细决策见 [ADR-0005](docs/10-decisions/ADR-0005-module-boundaries-and-structure-gates.md)。

## 提交前检查

Web 与契约：

```bash
pnpm format:check
pnpm structure:check
pnpm contract:validate
pnpm contract:generate
pnpm --filter @educhain/web typecheck
pnpm --filter @educhain/web lint
pnpm --filter @educhain/web build
```

Java Server：

```bash
cd apps/server
./mvnw --batch-mode verify
```

Evidence Gateway：

```bash
cd apps/evidence-gateway
python -m pip install -e '.[dev]'
ruff check src tests
ruff format --check src tests
mypy src
pytest
```

## Pull Request 要求

- 一个 PR 聚焦一个明确问题，避免混入无关格式化或重构。
- 标题说明用户或工程层面的结果，正文写清动机、方案、验证与风险。
- API、数据库、权限、错误码或用户界面发生变化时，更新对应文档。
- 不提交密钥、真实个人数据、构建产物、虚拟环境或编辑器配置。
- CI 必须通过；无法自动验证的内容应提供可重复的人工检查步骤。

## 贡献许可

除非贡献者明确声明其他安排，向本项目提交的贡献将按 [Apache License 2.0](LICENSE) 提供，具体条款以许可证正文为准。

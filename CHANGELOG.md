# 变更记录

本文件记录对使用者、贡献者和部署者有意义的变化。项目采用语义化版本表达兼容性，未发布内容统一保留在 `Unreleased`。

## Unreleased

### Added

- Web、Java Server 与 Evidence Gateway 三应用工作区。
- Mock 与 Remote 双模式、OpenAPI 契约和统一错误模型。
- 账户、资源发布、检索、互动、通知、存证、证书和管理治理闭环。
- Intlayer 中英文内容体系、设计令牌与主题切换。
- 模块化 Java MVC、存证模拟器与长安链适配边界。
- 自动结构门禁、三应用 CI、社区模板和开源治理文件。

### Changed

- 管理端、Mock 状态和资源编辑器按业务职责拆分。
- Java 跨模块协作改为窄端口与稳定领域快照。
- Web 容器构建上下文仅包含必要文件。

### Security

- 增加 CSRF、CSP、Cookie、CORS、限流、运行环境保护和私密漏洞报告规范。

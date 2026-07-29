import { t, type Dictionary } from "intlayer";

type Row = readonly [
  zhTitle: string,
  enTitle: string,
  zhBody: string,
  enBody: string,
  zhItems: readonly string[],
  enItems: readonly string[],
];

const informationContent = {
  key: "information-page",
  content: {
    backHome: t({ "zh-CN": "返回首页", en: "Back home" }),
    help: richPage(
      ["使用支持", "Product support"],
      ["帮助中心", "Help center"],
      [
        "按照实际任务查找入口、操作步骤、状态含义与恢复办法。账户、创作、检索、互动和存证问题都可以在这里开始定位。",
        "Find the right entry point, steps, state meanings and recovery actions for accounts, creation, discovery, community and evidence.",
      ],
      [
        [
          "开始使用",
          "Getting started",
          "访客可以浏览公开资源、社区和证明记录；注册后可使用创作、收藏、关注、通知、动态和支持工单。",
          "Visitors can browse public resources, community activity and proofs. Registered members can create, save, follow, receive notifications, review activity and submit tickets.",
          [
            "使用邮箱、唯一用户名和安全密码注册",
            "在资料页补充公开简介；登录邮箱不会自动公开",
            "从发现页或社区页开始浏览公开内容",
          ],
          [
            "Register with an email, unique handle and secure password",
            "Complete optional public profile fields; sign-in email is not public by default",
            "Start with Discover or Community to browse public content",
          ],
        ],
        [
          "账户与安全",
          "Account and security",
          "安全设置集中管理密码和设备会话。修改密码会使现有会话失效；遇到权限错误时，应先确认登录状态与账户状态。",
          "Security settings manage passwords and device sessions. Password changes invalidate sessions; permission errors should first be checked against sign-in and account status.",
          [
            "不要在资料、评论或工单中填写密码、令牌和私钥",
            "定期检查当前设备与其他会话",
            "401 表示需要登录，403 表示当前身份无权执行该动作",
          ],
          [
            "Never place passwords, tokens or private keys in profiles, comments or tickets",
            "Review the current device and other sessions",
            "401 means authentication is required; 403 means the signed-in identity lacks permission",
          ],
        ],
        [
          "发布资源",
          "Publishing resources",
          "在创作中心建立文章、文档、视频或外部链接草稿，补齐摘要、正文或来源、分类、标签、版权说明与所需文件后发布。",
          "Create an article, document, video or external-link draft in Studio, then complete summary, content or source, taxonomy, copyright and required files.",
          [
            "先保存草稿，再确认上传文件已经扫描完成",
            "发布会冻结一个独立版本，不会原地覆盖旧版本",
            "发布成功后，检索建立与存证处理会独立推进",
          ],
          [
            "Save the draft and confirm uploaded files finished scanning",
            "Publication freezes an independent version instead of overwriting history",
            "Search indexing and evidence processing continue independently after publication",
          ],
        ],
        [
          "检索与阅读",
          "Discovery and reading",
          "发现页支持关键词、分类、标签、作者、资源类型与排序组合。公开阅读页展示作者、版本、许可、附件与存证状态。",
          "Discover combines keyword, category, tag, creator, resource type and sorting. Public reading shows creator, version, license, attachments and evidence state.",
          [
            "无结果时依次减少标签、作者或类型条件",
            "排序原因来自标题、摘要、分类、标签、质量与适度时效信号",
            "外部来源内容会明确标注来源站点和规范链接",
          ],
          [
            "Broaden a zero-result query by removing tag, creator or type filters",
            "Ranking reflects title, summary, taxonomy, quality and measured recency signals",
            "External content identifies its source site and canonical link",
          ],
        ],
        [
          "互动与通知",
          "Community and notifications",
          "点赞、收藏、评论和关注都有明确的登录与权限反馈。通知中心按类型筛选，可逐条或批量标记已读。",
          "Likes, saves, comments and follows provide explicit authentication and permission feedback. Notifications can be filtered and marked read individually or in batches.",
          [
            "收藏可使用默认收藏夹或自定义收藏夹",
            "评论支持一级回复；删除后保留讨论结构",
            "可以分别控制每类通知的站内和外部偏好",
          ],
          [
            "Use the default collection or named collections",
            "Comments support one reply level; deletion preserves thread structure",
            "Configure in-app and external preference per notification type",
          ],
        ],
        [
          "存证与核验",
          "Evidence and verification",
          "证明页验证摘要与技术记录的一致性，不判断原创、权属或内容真实性。模拟器和长安链记录始终显示各自后端与网络标识。",
          "Proof pages verify digest consistency with technical records; they do not determine originality, ownership or truthfulness. Simulator and ChainMaker records always show their backend and network.",
          [
            "处理中可稍后刷新，不需要重复发布",
            "核验可使用内容摘要，也可指定证明或交易标识",
            "证书只对应特定资源版本，分享前应核对版本号",
          ],
          [
            "Refresh later while processing; do not republish",
            "Verify by digest alone or target a proof or transaction",
            "A certificate belongs to one resource version; check the version before sharing",
          ],
        ],
        [
          "故障与反馈",
          "Troubleshooting and feedback",
          "先保留页面、操作步骤、错误代码和资源标识，再选择重试、返回上一步或提交工单。可恢复错误不会要求用户重新完成整条流程。",
          "Keep the page, steps, error code and resource identifier, then retry, return or submit a ticket. Recoverable errors should not force the full workflow to restart.",
          [
            "409 通常表示版本冲突或重复写入",
            "422 表示字段或业务规则未通过",
            "具体内容问题使用举报；一般问题使用支持工单",
          ],
          [
            "409 usually indicates a version or idempotency conflict",
            "422 means field or business validation failed",
            "Report specific content; use support tickets for general issues",
          ],
        ],
      ],
    ),
    guides: richPage(
      ["完整流程", "End-to-end guides"],
      ["使用指南", "User guides"],
      [
        "围绕创作者、学习者、社区成员和管理员的真实目标组织完整操作顺序，并标注关键检查点。",
        "End-to-end workflows organized around the goals of creators, learners, community members and administrators, with explicit checkpoints.",
      ],
      [
        [
          "创作者首次发布",
          "First publication",
          "从账户资料到公开资源与证明记录，首次发布应按稳定顺序完成。",
          "Follow a stable sequence from account profile to public resource and evidence record.",
          [
            "完善显示名称和作者简介",
            "建立草稿并选择正确资源类型",
            "上传、扫描、分类、标签和版权信息全部确认后发布",
            "在公开页检查版本，再查看存证任务和证书",
          ],
          [
            "Complete display name and creator bio",
            "Create a draft with the correct resource type",
            "Confirm upload, scan, taxonomy and copyright before publishing",
            "Check the public version, evidence job and certificate",
          ],
        ],
        [
          "发布新版本",
          "Publishing a new version",
          "公开内容需要修订时，从历史版本恢复到草稿或继续编辑现有草稿，再形成新的公开版本。",
          "When public content needs revision, restore a historical version into a draft or continue the current draft, then publish a new version.",
          [
            "旧版本正文、摘要和证明保持不变",
            "新版本拥有新的版本号、摘要与存证任务",
            "公开页默认展示当前版本，同时保留历史关系",
          ],
          [
            "Old content, digest and proof remain unchanged",
            "The new version receives a new number, digest and evidence job",
            "The public page shows the current version while preserving history",
          ],
        ],
        [
          "学习与知识整理",
          "Learning and knowledge organization",
          "学习者可以通过搜索、分类和社区发现资源，再用收藏夹、浏览历史和动态形成个人学习路径。",
          "Learners discover content through search, taxonomy and community, then use collections, history and activity to form a personal path.",
          [
            "先用宽关键词探索，再用分类和标签收敛",
            "阅读时核对作者、来源、许可与存证后端",
            "按课程或主题建立收藏夹，并定期清理",
          ],
          [
            "Explore with broad keywords, then narrow with category and tags",
            "Review creator, source, license and evidence backend",
            "Create course or topic collections and review them regularly",
          ],
        ],
        [
          "参与社区",
          "Community participation",
          "社区页展示主题、活跃创作者、贡献排行与完整发布流。登录后可切换到关注动态。",
          "Community shows topics, active creators, contributor rankings and the full publication feed. Signed-in members can switch to following activity.",
          [
            "关注与学习目标相关的作者",
            "评论聚焦内容本身并提供可验证上下文",
            "对疑似侵权、骚扰或危险内容使用举报入口",
          ],
          [
            "Follow creators relevant to learning goals",
            "Keep comments focused and provide verifiable context",
            "Report suspected infringement, harassment or unsafe content",
          ],
        ],
        [
          "核验与证书",
          "Verification and certificates",
          "核验不是简单看“已上链”标记，而是确认目标版本、摘要、后端、网络和交易记录彼此对应。",
          "Verification means checking version, digest, backend, network and transaction relationships—not merely reading an on-chain badge.",
          [
            "从资源页进入对应版本的证明页",
            "复制摘要进行独立核验并检查 MATCHED 结果",
            "模拟器证书用于本地演示，不能描述为真实链上凭证",
          ],
          [
            "Open the proof for the intended version",
            "Verify the digest and check for MATCHED",
            "Simulator certificates are local demonstrations, not real on-chain credentials",
          ],
        ],
        [
          "管理与治理",
          "Administration and governance",
          "管理员工作台按用户、资源、评论、举报、分类、存证任务、审计、统计和运行状态拆分职责。",
          "Administration separates users, resources, comments, reports, taxonomy, evidence jobs, audit, statistics and health.",
          [
            "治理动作必须填写原因并校验版本",
            "举报需要逐项复核目标和上下文",
            "重试存证前先确认错误是否可恢复",
            "设置变更、导出和维护任务都留下审计记录",
          ],
          [
            "Governance actions require a reason and version check",
            "Review each report target and its context",
            "Confirm an evidence failure is recoverable before retrying",
            "Setting changes, exports and maintenance jobs are audited",
          ],
        ],
      ],
    ),
    developers: richPage(
      ["开放契约", "Open contract"],
      ["开发者资料", "Developer resources"],
      [
        "Web、Mock、Java Server 与存证网关以稳定边界协作；OpenAPI 是 HTTP 行为和数据模型的唯一契约来源。",
        "Web, Mock, Java Server and the evidence gateway collaborate through stable boundaries; OpenAPI is the single source of truth for HTTP behavior and data shapes.",
      ],
      [
        [
          "应用组成",
          "Application topology",
          "系统由 Next.js Web、Spring Boot Java Server 和 FastAPI 存证网关三个应用组成。",
          "The system consists of a Next.js Web app, Spring Boot Java Server and FastAPI evidence gateway.",
          [
            "Web 负责界面、国际化、主题和客户端状态",
            "Java Server 负责账户、内容、互动、治理与持久化事实",
            "存证网关隔离本地模拟器与长安链 SDK",
          ],
          [
            "Web owns UI, localization, themes and client state",
            "Java Server owns account, content, community, governance and persistence facts",
            "The evidence gateway isolates the simulator and ChainMaker SDK",
          ],
        ],
        [
          "契约与双模式",
          "Contract and dual mode",
          "前端数据访问层不感知 Mock 或真实后端差异，两种模式共享请求、响应、分页和错误类型。",
          "The frontend data layer is unaware of Mock versus remote mode; both share request, response, pagination and error types.",
          [
            "业务接口统一位于 /api/v1",
            "生成类型来自 OpenAPI，不手写平行 DTO",
            "Mock 覆盖成功、未登录、无权限、冲突、校验和失败状态",
          ],
          [
            "Business APIs live under /api/v1",
            "Generated types come from OpenAPI, without parallel handwritten DTOs",
            "Mock covers success, authentication, authorization, conflict, validation and failure states",
          ],
        ],
        [
          "认证与写请求",
          "Authentication and writes",
          "浏览器使用 HttpOnly Cookie 会话；需要保护的写请求同时携带 CSRF 令牌，并按语义提供幂等键或版本条件。",
          "Browsers use HttpOnly cookie sessions. Protected writes also carry CSRF tokens and, where appropriate, idempotency or version conditions.",
          [
            "注册、发布等可重放写入使用 Idempotency-Key",
            "更新与治理使用 If-Match 防止覆盖并发修改",
            "匿名会话探测返回 204，不把正常访客状态当作控制台错误",
          ],
          [
            "Replay-safe writes such as registration and publication use Idempotency-Key",
            "Updates and governance use If-Match to prevent lost updates",
            "Anonymous session probes return 204 instead of treating guest state as a console error",
          ],
        ],
        [
          "统一错误模型",
          "Unified error model",
          "所有接口错误采用 Problem Details，并提供稳定 code、requestId 和安全参数。",
          "All API failures use Problem Details with a stable code, requestId and safe parameters.",
          [
            "客户端按 code 国际化，不解析服务端英文详情",
            "字段错误关联到具体表单控件",
            "日志通过 requestId 串联，但不回显敏感堆栈",
          ],
          [
            "Clients localize by code and never parse server prose",
            "Field errors bind to their controls",
            "Logs correlate by requestId without exposing sensitive stacks",
          ],
        ],
        [
          "Java 模块化 MVC",
          "Modular Java MVC",
          "每个业务模块内部按 controller、service、repository、domain 与 dto 分层，并只通过公开服务或事件跨模块协作。",
          "Each business module separates controller, service, repository, domain and DTO layers, collaborating across modules through public services or events.",
          [
            "Controller 处理 HTTP，Service 处理用例与事务",
            "Repository 只属于本模块，不能绕过边界读取其他模块表",
            "外部存证不阻塞发布事务，可靠任务负责重试与收敛",
          ],
          [
            "Controllers handle HTTP; services handle use cases and transactions",
            "Repositories belong to one module and never bypass another module's boundary",
            "External evidence never blocks publication; reliable jobs handle retry and convergence",
          ],
        ],
        [
          "分页、版本与兼容",
          "Pagination, versions and compatibility",
          "列表使用不透明游标，公开内容使用不可变版本，新增契约字段保持兼容。",
          "Lists use opaque cursors, public content uses immutable versions, and additive contract fields preserve compatibility.",
          [
            "客户端不能猜测或拼接游标",
            "破坏性接口变化需要新的契约版本",
            "摘要规范和证明载荷都带显式版本号",
          ],
          [
            "Clients never infer or construct cursors",
            "Breaking API changes require a new contract version",
            "Canonicalization and proof payloads carry explicit versions",
          ],
        ],
        [
          "本地开发检查",
          "Local development checks",
          "开发时先选择 Mock 或 Remote 模式，再分别启动对应应用；任何接口变化都要同步更新契约、实现和前端消费。",
          "Choose Mock or Remote mode before starting the relevant applications. Every API change must update contract, implementation and frontend consumption together.",
          [
            "Mock 模式只需 Web，可完整演示主要业务",
            "Remote 模式启动数据库、Java Server、存证网关与 Web",
            "提交前检查契约操作数、静态类型、格式、构建与浏览器控制台",
          ],
          [
            "Mock mode needs only Web and demonstrates the major workflows",
            "Remote mode starts database, Java Server, evidence gateway and Web",
            "Before delivery, check operation parity, static types, formatting, builds and browser console",
          ],
        ],
      ],
    ),
    changelog: richPage(
      ["项目时间线", "Project timeline"],
      ["变更说明", "Changelog"],
      [
        "本项目的集中设计与优化从 2026 年 6 月 25 日开始，于 2026 年 7 月 31 日正式收敛完成。以下日期说明各阶段形成的可交付能力。",
        "The focused design and optimization period began on June 25, 2026 and formally converged on July 31, 2026. The dates below identify the deliverables established in each phase.",
      ],
      [
        [
          "2026 年 6 月 25 日｜设计基线",
          "June 25, 2026 | Design baseline",
          "明确产品目标、三应用边界、模块化 MVC、OpenAPI 契约、统一错误模型和前后端双模式。",
          "Established product goals, three-application boundaries, modular MVC, OpenAPI, unified errors and dual frontend modes.",
          [
            "形成信息架构、权限矩阵与核心状态模型",
            "确定设计系统、国际化、主题和可访问性原则",
            "定义项目时间边界与演示数据口径",
          ],
          [
            "Established information architecture, permissions and core states",
            "Defined design system, localization, theme and accessibility principles",
            "Defined the project period and demo-data conventions",
          ],
        ],
        [
          "2026 年 6 月 30 日｜工程基础",
          "June 30, 2026 | Foundation",
          "完成 Web、Java Server 与存证网关工程骨架，以及数据库、Mock、接口类型和通用组件基础。",
          "Completed the Web, Java Server and evidence gateway foundations, plus database, Mock, API types and shared components.",
          [
            "统一布局、导航、表单、反馈与数据访问层",
            "建立 Controller、Service、Repository、Domain 和 DTO 边界",
            "接入本地存证模拟器契约",
          ],
          [
            "Unified layout, navigation, forms, feedback and data access",
            "Established Controller, Service, Repository, Domain and DTO boundaries",
            "Connected the local evidence simulator contract",
          ],
        ],
        [
          "2026 年 7 月 8 日｜内容闭环",
          "July 8, 2026 | Content loop",
          "账户资料、资源草稿、文件上传、发布、公开阅读与版本历史形成完整闭环。",
          "Accounts, profiles, drafts, uploads, publication, public reading and version history formed a complete loop.",
          [
            "支持文章、文档、视频和外部链接",
            "发布与检索、存证异步处理解耦",
            "补齐权限、并发、校验与恢复状态",
          ],
          [
            "Supported articles, documents, videos and external links",
            "Decoupled publication from search and evidence processing",
            "Completed permission, concurrency, validation and recovery states",
          ],
        ],
        [
          "2026 年 7 月 16 日｜发现与社区",
          "July 16, 2026 | Discovery and community",
          "完成分类检索、可解释排序、点赞、收藏、评论、关注、通知、动态、社区与成就体系。",
          "Completed taxonomy search, explainable ranking, likes, collections, comments, follows, notifications, activity, community and achievements.",
          [
            "发现页支持组合筛选与空状态恢复",
            "社区提供主题、活跃创作者和完整发布流",
            "通知偏好与互动状态保持一致",
          ],
          [
            "Discover supports combined filters and zero-result recovery",
            "Community provides topics, active creators and the full publication feed",
            "Notification preferences remain consistent with interactions",
          ],
        ],
        [
          "2026 年 7 月 23 日｜存证与治理",
          "July 23, 2026 | Evidence and governance",
          "完成长安链适配边界、存证任务、公开核验、证书、账本视图，以及管理后台和审计流程。",
          "Completed ChainMaker adapter boundaries, evidence jobs, public verification, certificates, ledger views, administration and audit workflows.",
          [
            "模拟器与真实后端明确标识",
            "举报、评论、用户、分类和资源治理可复核",
            "存证失败具备重试、终止和证书恢复状态",
          ],
          [
            "Simulator and real backends are clearly labeled",
            "Reports, comments, users, taxonomy and resources are reviewable",
            "Evidence failure supports retry, termination and certificate recovery",
          ],
        ],
        [
          "2026 年 7 月 31 日｜正式收敛",
          "July 31, 2026 | Final convergence",
          "完成安全、性能、国际化、可访问性、可观测性、演示数据和开发文档的统一检查，形成版本 1.0。",
          "Completed unified checks for security, performance, localization, accessibility, observability, demo data and development documentation, forming release 1.0.",
          [
            "用户可见项目数据限定在 6 月 25 日至 7 月 31 日",
            "Mock 与真实接口保持同一契约",
            "帮助、指南、开发者、法律与项目信息全部补齐",
          ],
          [
            "User-visible project data stays between June 25 and July 31",
            "Mock and remote APIs share the same contract",
            "Help, guides, developer, legal and project information are complete",
          ],
        ],
      ],
    ),
    terms: legalPage(
      ["服务规则", "Service rules"],
      ["服务条款", "Terms of service"],
      [
        "使用 EduChain 即表示你同意维护账户安全、合法分享、尊重他人权利，并在产品标明的能力边界内使用服务。",
        "Using EduChain means maintaining account security, sharing lawfully, respecting others' rights and using the service within stated product boundaries.",
      ],
      [
        [
          "账户与资格",
          "Accounts and eligibility",
          "账户信息应真实可管理，不得冒用他人身份、共享凭据或自动化批量注册。",
          "Account information must be manageable and must not impersonate others, share credentials or automate bulk registration.",
        ],
        [
          "允许的使用",
          "Acceptable use",
          "不得绕过权限、限流、审核、文件扫描或存证状态，不得干扰服务稳定性。",
          "Do not bypass authorization, rate limits, moderation, file scanning or evidence state, or disrupt service stability.",
        ],
        [
          "内容责任",
          "Content responsibility",
          "发布者负责确认来源、许可、引用和内容安全，并及时修正不准确说明。",
          "Publishers are responsible for source, license, attribution, safety and timely corrections.",
        ],
        [
          "社区规则",
          "Community rules",
          "评论与互动应围绕学习和内容，不得骚扰、刷量、发布危险信息或恶意举报。",
          "Discussion must remain learning-focused and must not harass, manipulate signals, publish unsafe information or abuse reporting.",
        ],
        [
          "治理与申诉",
          "Governance and review",
          "平台可限制账户、下架内容或暂停能力，并保留原因、审计与复核路径。",
          "The platform may restrict accounts, withdraw content or suspend capabilities while preserving reason, audit and review paths.",
        ],
        [
          "服务变化",
          "Service changes",
          "功能、数据范围或规则变化会在产品说明中记录；继续使用前应查看最新说明。",
          "Capability, data-scope or rule changes are recorded in product information and should be reviewed before continued use.",
        ],
      ],
    ),
    privacy: legalPage(
      ["数据边界", "Data boundaries"],
      ["隐私说明", "Privacy notice"],
      [
        "系统按最小必要原则处理账户、内容、互动、安全和存证数据，并区分公开信息、个人信息与受控治理记录。",
        "The system processes account, content, interaction, security and evidence data by necessity, distinguishing public, personal and governed records.",
      ],
      [
        [
          "收集范围",
          "Data collected",
          "包括登录邮箱、公开资料、资源内容、文件元数据、互动、会话、安全日志和工单内容。",
          "Data includes sign-in email, public profile, resources, file metadata, interactions, sessions, security logs and ticket content.",
        ],
        [
          "使用目的",
          "Purpose",
          "数据用于提供登录、发布、检索、推荐、通知、核验、治理、安全和故障恢复。",
          "Data supports sign-in, publication, search, recommendations, notifications, verification, governance, security and recovery.",
        ],
        [
          "公开范围",
          "Visibility",
          "显示名称、用户名、作者简介和公开资源可被访问；登录邮箱、会话与个人历史默认不公开。",
          "Display name, handle, creator bio and public resources are visible; sign-in email, sessions and personal history are private by default.",
        ],
        [
          "存证最小化",
          "Evidence minimization",
          "存证网关只接收必要标识和摘要，不把完整正文、密码或私密资料写入证明后端。",
          "The evidence gateway receives necessary identifiers and digests, never full content, passwords or private profile data.",
        ],
        [
          "保留与清理",
          "Retention and cleanup",
          "版本证明与审计按可追溯目的保留；过期会话、临时上传与可清理数据由维护任务处理。",
          "Version proofs and audits are retained for traceability; expired sessions, temporary uploads and eligible records are cleaned by maintenance jobs.",
        ],
        [
          "个人控制",
          "User control",
          "用户可编辑公开资料、管理会话与通知偏好、清理浏览历史，并通过工单提出数据问题。",
          "Users can edit public profile, manage sessions and notification preferences, clear history and raise data questions through support.",
        ],
      ],
    ),
    copyright: legalPage(
      ["创作与引用", "Creation and attribution"],
      ["版权说明", "Copyright policy"],
      [
        "技术存证不能替代版权认定。平台要求发布者说明来源与许可，并为权利人提供举报、复核和恢复路径。",
        "Technical evidence does not determine copyright. Publishers must state source and license, while rights holders receive report, review and restoration paths.",
      ],
      [
        [
          "原创内容",
          "Original work",
          "作者应保留创作材料和版本记录，并选择与预期分享范围一致的许可说明。",
          "Creators should retain working materials and versions and choose a license aligned with intended sharing.",
        ],
        [
          "引用与改编",
          "Quotation and adaptation",
          "引用需标明作者、标题、来源链接和许可；改编内容还应说明修改范围。",
          "Quotations identify creator, title, source and license; adaptations also describe the changes.",
        ],
        [
          "附件与链接",
          "Files and links",
          "上传文档、图片或视频前应确认授权；外部链接不等于平台拥有目标内容。",
          "Confirm authorization before uploading documents, images or video; an external link does not imply platform ownership.",
        ],
        [
          "举报材料",
          "Report evidence",
          "权利人应提供目标资源、权利依据、具体问题和可联系信息，不要提交无关敏感数据。",
          "Rights holders should provide the target, basis of claim, specific issue and contact route without unrelated sensitive data.",
        ],
        [
          "处理结果",
          "Resolution",
          "平台可下架、恢复或维持内容，并记录处理原因；争议双方仍可寻求独立法律意见。",
          "The platform may withdraw, restore or retain content and records its reason; parties may still seek independent legal advice.",
        ],
      ],
    ),
    disclaimer: legalPage(
      ["责任边界", "Responsibility boundary"],
      ["免责声明", "Disclaimer"],
      [
        "本系统用于教育知识共享、智能检索与技术存证演示，不提供法律、学术认证、医疗、投资或其他专业决策意见。",
        "This system demonstrates educational sharing, intelligent discovery and technical evidence; it does not provide legal, academic accreditation, medical, investment or other professional advice.",
      ],
      [
        [
          "内容准确性",
          "Content accuracy",
          "公开资源由用户或外部来源提供，平台治理不能保证所有内容始终完整、最新或适合特定目的。",
          "Public resources are user- or source-provided; governance cannot guarantee completeness, currency or fitness for purpose.",
        ],
        [
          "检索与推荐",
          "Search and recommendations",
          "排序和推荐用于发现内容，不代表质量认证、官方立场或对结果的保证。",
          "Ranking and recommendations support discovery and do not certify quality, express an official position or guarantee outcomes.",
        ],
        [
          "存证含义",
          "Meaning of evidence",
          "摘要一致仅表示技术记录相符，不自动证明原创、权属、内容真实性或法律效力。",
          "A digest match shows technical consistency and does not prove originality, ownership, truthfulness or legal effect.",
        ],
        [
          "模拟环境",
          "Simulation environment",
          "本地模拟器生成的交易、区块和证书只用于功能演示，页面会明确标注后端。",
          "Transactions, blocks and certificates from the local simulator are functional demonstrations and are labeled by backend.",
        ],
        [
          "外部服务",
          "External services",
          "外部链接、来源站点和长安链环境由各自提供方负责，连接失败不改变本地业务事实。",
          "External links, source sites and ChainMaker environments are operated by their providers; connection failures do not change local business facts.",
        ],
      ],
    ),
    about: richPage(
      ["项目介绍", "Project overview"],
      ["关于 EduChain", "About EduChain"],
      [
        "EduChain 是面向教育知识共享、智能检索与可核验存证的本科毕业设计系统，自始至终按清晰的新架构独立设计。",
        "EduChain is an undergraduate graduation project for educational knowledge sharing, intelligent discovery and verifiable evidence, designed around a clear new architecture from the beginning.",
      ],
      [
        [
          "问题与目标",
          "Problem and goal",
          "项目解决教育资源来源分散、版本关系模糊、检索解释不足和技术证明难以核验的问题。",
          "The project addresses fragmented sources, unclear versions, opaque discovery and hard-to-verify technical evidence.",
          [
            "让创作者顺畅发布并保留版本事实",
            "让学习者快速发现、组织和判断资源",
            "让证明与治理都有清晰来源和边界",
          ],
          [
            "Help creators publish while preserving version facts",
            "Help learners discover, organize and assess resources",
            "Give evidence and governance clear provenance and boundaries",
          ],
        ],
        [
          "产品范围",
          "Product scope",
          "系统覆盖账户资料、四类资源、上传、阅读、搜索、社区互动、通知、成就、外部内容、存证核验、支持与管理。",
          "The product covers accounts, four resource formats, uploads, reading, search, community, notifications, achievements, external content, evidence, support and administration.",
          [
            "普通用户与管理员拥有分离的工作区",
            "公开阅读与证明无需暴露私有数据",
            "Mock 和真实后端支持同一完整产品体验",
          ],
          [
            "Members and administrators have separated workspaces",
            "Public reading and proofs do not expose private data",
            "Mock and remote backends support the same complete product experience",
          ],
        ],
        [
          "三应用架构",
          "Three-application architecture",
          "Web 提供产品体验，Java Server 管理业务事实，存证网关隔离不同证明后端。",
          "Web provides the product experience, Java Server manages business facts, and the evidence gateway isolates proof backends.",
          [
            "Next.js、TypeScript、Tailwind CSS 与 Intlayer",
            "Spring Boot、模块化 MVC、PostgreSQL 与 Flyway",
            "FastAPI、本地模拟器与长安链适配器",
          ],
          [
            "Next.js, TypeScript, Tailwind CSS and Intlayer",
            "Spring Boot, modular MVC, PostgreSQL and Flyway",
            "FastAPI, local simulator and ChainMaker adapter",
          ],
        ],
        [
          "设计原则",
          "Design principles",
          "视觉语言强调克制、层级、留白和可读性，不依赖夸张动效；交互保持一致并尊重系统主题偏好。",
          "The visual language favors restraint, hierarchy, space and readability over spectacle, with consistent interactions and system theme support.",
          [
            "浅色、深色和跟随系统三种主题",
            "中英文完整覆盖并为长文本留出空间",
            "键盘、焦点、语义和对比度纳入设计基线",
          ],
          [
            "Light, dark and system themes",
            "Complete Chinese and English coverage with room for long text",
            "Keyboard, focus, semantics and contrast are baseline requirements",
          ],
        ],
        [
          "可信边界",
          "Trust boundary",
          "平台只声明能够技术核验的事实，不把存证包装为版权、真伪或质量背书。",
          "The platform claims only technically verifiable facts and never presents evidence as copyright, truth or quality endorsement.",
          [
            "公开版本不可变，修订形成新版本",
            "模拟器与长安链记录分别标注",
            "治理动作保留原因、版本和审计线索",
          ],
          [
            "Public versions are immutable; revisions create new versions",
            "Simulator and ChainMaker records are labeled separately",
            "Governance preserves reason, version and audit context",
          ],
        ],
        [
          "项目周期",
          "Project period",
          "集中设计与优化于 2026 年 6 月 25 日开始，2026 年 7 月 31 日正式结束；演示业务时间也统一位于这一范围。",
          "Focused design and optimization began on June 25, 2026 and formally ended on July 31, 2026; demo business timestamps use the same range.",
          [
            "阶段成果在变更说明中逐项列出",
            "运行时生成的真实日志仍遵循实际系统时钟",
            "依赖版本日期只代表软件版本，不代表项目进度",
          ],
          [
            "Milestones are listed in the changelog",
            "Real runtime logs continue to use the actual system clock",
            "Dependency release dates describe software versions, not project progress",
          ],
        ],
      ],
    ),
    contact: richPage(
      ["取得联系", "Get in touch"],
      ["联系与支持", "Contact and support"],
      [
        "系统不展示虚构邮箱、电话或办公地址。账户、内容、版权、存证和技术问题统一通过产品内工单与举报入口处理。",
        "The system does not publish fictional email, phone or office details. Account, content, copyright, evidence and technical issues use in-product tickets and reports.",
      ],
      [
        [
          "支持工单",
          "Support tickets",
          "登录后进入支持中心，选择问题分类，填写清晰主题、复现步骤、资源标识和预期结果。",
          "Sign in to Support, select a category and provide a clear subject, reproduction steps, resource identifier and expected result.",
          [
            "账户、内容、版权、存证、技术和其他六类入口",
            "可继续补充信息并查看 OPEN、处理中、待补充、已解决或已关闭状态",
            "工单保留完整对话和处理上下文",
          ],
          [
            "Six categories: account, content, copyright, evidence, technical and other",
            "Add information and follow open, in-progress, waiting, resolved or closed states",
            "Tickets preserve the full conversation and resolution context",
          ],
        ],
        [
          "内容举报",
          "Content reports",
          "针对具体资源或评论，使用目标旁的举报入口，不要用一般工单替代明确的治理目标。",
          "For a specific resource or comment, use its report action rather than a general ticket.",
          [
            "选择垃圾信息、骚扰、版权、错误信息、危险内容或其他原因",
            "说明具体问题及其所在位置",
            "管理员复核后会记录解决或驳回原因",
          ],
          [
            "Choose spam, harassment, copyright, misinformation, unsafe content or other",
            "Describe the specific issue and location",
            "Administrators record the reason for resolution or dismissal",
          ],
        ],
        [
          "提交前准备",
          "Before submitting",
          "高质量上下文可以减少来回确认，但不应包含与问题无关的隐私或凭据。",
          "Good context reduces back-and-forth but should not include unrelated private data or credentials.",
          [
            "保留页面地址、资源或证明标识",
            "记录操作步骤、错误代码和出现状态",
            "可描述设备与浏览器类型，但不要提交 Cookie 或令牌",
          ],
          [
            "Keep the page URL and resource or proof identifier",
            "Record steps, error code and observed state",
            "Describe device and browser type without sending cookies or tokens",
          ],
        ],
        [
          "处理优先级",
          "Priority",
          "版权、安全、账户访问和持续影响关键流程的问题会优先复核；一般建议按正常队列处理。",
          "Copyright, safety, account access and persistent critical-flow issues receive priority; general suggestions use the normal queue.",
          [
            "HIGH 表示需要优先关注，不代表立即解决",
            "待用户补充时应在原工单继续回复",
            "已解决后仍有新证据可以提交新的关联工单",
          ],
          [
            "HIGH indicates priority, not an instant resolution guarantee",
            "Reply in the same ticket when more information is requested",
            "New evidence after resolution can be submitted in a linked new ticket",
          ],
        ],
        [
          "安全提醒",
          "Security reminder",
          "平台支持人员不会索取密码、验证码、私钥、完整会话 Cookie 或个人设备控制权。",
          "Support never asks for passwords, verification codes, private keys, full session cookies or control of personal devices.",
          [
            "发现敏感信息应立即停止发送",
            "怀疑账户泄露时先修改密码并撤销其他会话",
            "证明核验只需要公开摘要或公开标识",
          ],
          [
            "Stop immediately if sensitive data is about to be sent",
            "Change password and revoke other sessions if compromise is suspected",
            "Proof verification needs only public digests or identifiers",
          ],
        ],
        [
          "产品建议",
          "Product feedback",
          "一般体验建议可通过 OTHER 类工单提交，说明使用目标、当前阻碍和期望结果。",
          "Submit general product suggestions as OTHER tickets with the goal, current friction and expected result.",
          [
            "避免只写“无法使用”或“需要优化”",
            "附上受影响页面和具体任务",
            "建议会作为产品复核输入，不构成实现承诺",
          ],
          [
            "Avoid vague reports such as “does not work” or “needs improvement”",
            "Include the affected page and task",
            "Suggestions inform product review and do not constitute implementation commitments",
          ],
        ],
      ],
    ),
    cooperation: richPage(
      ["开放合作", "Collaboration"],
      ["合作信息", "Collaboration information"],
      [
        "项目欢迎围绕教育资源规范、检索评测、无障碍和可信存证开展边界清楚的非商业教学交流。",
        "The project welcomes well-scoped non-commercial educational collaboration around resource standards, search evaluation, accessibility and trustworthy evidence.",
      ],
      [
        [
          "适合方向",
          "Suitable areas",
          "合作主题应与教学、研究方法或开放技术验证直接相关。",
          "Topics should directly support teaching, research methods or open technical validation.",
          [
            "课程资源元数据和开放许可规范",
            "检索相关性评测集与解释方法",
            "无障碍和双语体验评审",
            "长安链教学环境与存证实验",
          ],
          [
            "Course-resource metadata and open licensing",
            "Search relevance datasets and explanation methods",
            "Accessibility and bilingual experience reviews",
            "ChainMaker teaching environments and evidence experiments",
          ],
        ],
        [
          "不适合范围",
          "Out of scope",
          "本项目不发布虚构职位、采购、融资、商业背书或未经确认的机构合作。",
          "The project does not publish fictional jobs, procurement, funding, commercial endorsement or unconfirmed institutional partnerships.",
          ["不接收来源不明的个人数据", "不以存证结果承诺法律效力", "不绕过版权、伦理或安全审查"],
          [
            "No personal data of unknown provenance",
            "No promise of legal effect from evidence",
            "No bypass of copyright, ethics or security review",
          ],
        ],
        [
          "提出合作",
          "Proposing collaboration",
          "通过支持工单说明参与者、教学目标、预期成果、所需数据和完成条件。",
          "Use a support ticket to state participants, learning goal, expected outcome, required data and completion criteria.",
          [
            "先提交一页以内的范围说明",
            "标明公开、内部或受限信息",
            "指出希望使用 Mock 还是真实后端环境",
          ],
          [
            "Start with a one-page scope description",
            "Mark public, internal and restricted information",
            "State whether Mock or remote backend is required",
          ],
        ],
        [
          "评审流程",
          "Review process",
          "合作先检查目标一致性，再检查数据、版权、安全、工作量和成果使用方式。",
          "Collaboration is reviewed for goal alignment, then data, copyright, security, effort and outcome use.",
          ["明确唯一联系人和决策方式", "小范围验证后再扩大样本", "任何范围变化都重新确认边界"],
          [
            "Name one contact and decision process",
            "Validate on a small scope before expanding",
            "Reconfirm boundaries when scope changes",
          ],
        ],
        [
          "数据与版权",
          "Data and copyright",
          "所有样本必须说明来源、许可、是否包含个人信息和允许的使用范围。",
          "Every sample identifies source, license, personal-data presence and permitted use.",
          [
            "优先使用公开、匿名化和可复现数据",
            "原始材料与衍生成果分别标记许可",
            "合作结束后按约定归档或清理受限数据",
          ],
          [
            "Prefer public, anonymized and reproducible data",
            "License source material and derived outcomes separately",
            "Archive or clean restricted data as agreed at completion",
          ],
        ],
        [
          "成果与署名",
          "Outcomes and attribution",
          "预期成果、作者贡献、展示方式和可复用范围应在开始前写清楚。",
          "Expected outcomes, contributions, presentation and reuse scope should be clear before work begins.",
          [
            "技术结论必须能被复核",
            "演示数据不能冒充真实机构数据",
            "署名反映实际贡献，不暗示机构背书",
          ],
          [
            "Technical conclusions must be reviewable",
            "Demo data must not impersonate institutional data",
            "Attribution reflects contribution without implying endorsement",
          ],
        ],
      ],
    ),
  },
} satisfies Dictionary;

function richPage(
  eyebrow: readonly [string, string],
  title: readonly [string, string],
  description: readonly [string, string],
  rows: readonly Row[],
) {
  return {
    eyebrow: t({ "zh-CN": eyebrow[0], en: eyebrow[1] }),
    title: t({ "zh-CN": title[0], en: title[1] }),
    description: t({ "zh-CN": description[0], en: description[1] }),
    sections: rows.map(([zhTitle, enTitle, zhBody, enBody, zhItems, enItems]) => ({
      title: t({ "zh-CN": zhTitle, en: enTitle }),
      body: t({ "zh-CN": zhBody, en: enBody }),
      items: zhItems.map((item, index) => t({ "zh-CN": item, en: enItems[index] })),
    })),
  };
}

function legalPage(
  eyebrow: readonly [string, string],
  title: readonly [string, string],
  description: readonly [string, string],
  rows: ReadonlyArray<readonly [string, string, string, string]>,
) {
  return richPage(
    eyebrow,
    title,
    description,
    rows.map(([zhTitle, enTitle, zhBody, enBody]) => [zhTitle, enTitle, zhBody, enBody, [], []]),
  );
}

export default informationContent;

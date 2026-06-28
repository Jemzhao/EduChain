# 错误代码目录

- 状态：Accepted

## 1. 命名

格式：`DOMAIN_REASON`。错误代码稳定、全大写、面向程序，不包含 HTTP 数字。

## 2. 通用错误

| 错误代码                  | HTTP | 是否可重试 | 语义                   |
| ------------------------- | ---- | ---------- | ---------------------- |
| `REQUEST_INVALID`         | 400  | 否         | 请求整体不符合要求     |
| `FIELD_VALIDATION_FAILED` | 422  | 否         | 一个或多个字段错误     |
| `AUTHENTICATION_REQUIRED` | 401  | 否         | 需要登录               |
| `SESSION_EXPIRED`         | 401  | 否         | 会话已过期             |
| `ACCESS_DENIED`           | 403  | 否         | 没有访问能力           |
| `RESOURCE_NOT_FOUND`      | 404  | 否         | 对象不存在或不可见     |
| `VERSION_CONFLICT`        | 409  | 否         | 并发版本不一致         |
| `IDEMPOTENCY_CONFLICT`    | 409  | 否         | 同一幂等键对应不同请求 |
| `RATE_LIMITED`            | 429  | 是         | 请求过多，按提示等待   |
| `SERVICE_UNAVAILABLE`     | 503  | 是         | 服务暂不可用           |
| `UNEXPECTED_ERROR`        | 500  | 视情况     | 未预期错误             |

## 3. 账户与用户

| 错误代码                       | HTTP | 语义               |
| ------------------------------ | ---- | ------------------ |
| `ACCOUNT_IDENTIFIER_TAKEN`     | 409  | 邮箱或用户名已占用 |
| `ACCOUNT_CREDENTIALS_INVALID`  | 401  | 凭据无效           |
| `ACCOUNT_RESTRICTED`           | 403  | 账户受限           |
| `ACCOUNT_DISABLED`             | 403  | 账户停用           |
| `PASSWORD_RESET_TOKEN_INVALID` | 400  | 重置凭据无效或过期 |
| `ROLE_PROTECTED`               | 409  | 违反管理员保护规则 |

## 4. 资源与文件

| 错误代码                        | HTTP | 语义               |
| ------------------------------- | ---- | ------------------ |
| `DRAFT_NOT_EDITABLE`            | 409  | 当前草稿不可编辑   |
| `RESOURCE_NOT_PUBLISHABLE`      | 409  | 不满足发布条件     |
| `RESOURCE_ALREADY_WITHDRAWN`    | 409  | 资源已下架         |
| `CATEGORY_UNAVAILABLE`          | 422  | 分类不可用         |
| `TAG_UNAVAILABLE`               | 422  | 标签不可用         |
| `UPLOAD_TOO_LARGE`              | 413  | 文件超过限制       |
| `UPLOAD_MEDIA_TYPE_UNSUPPORTED` | 415  | 文件类型不支持     |
| `UPLOAD_NOT_READY`              | 409  | 文件尚未通过检查   |
| `UPLOAD_REJECTED`               | 422  | 文件未通过安全检查 |

## 5. 互动

| 错误代码                         | HTTP | 语义                       |
| -------------------------------- | ---- | -------------------------- |
| `COMMENT_NOT_ALLOWED`            | 409  | 当前资源不允许评论         |
| `COMMENT_PARENT_INVALID`         | 422  | 回复目标无效               |
| `FOLLOW_SELF_NOT_ALLOWED`        | 422  | 不能关注自己               |
| `INTERACTION_TARGET_UNAVAILABLE` | 409  | 目标当前不可互动           |
| `DEFAULT_COLLECTION_PROTECTED`   | 409  | 默认收藏夹不允许删除       |
| `COLLECTION_NAME_TAKEN`          | 409  | 本人收藏夹名称重复         |
| `NOTIFICATION_BATCH_INVALID`     | 422  | 批量已读或偏好快照语义无效 |

## 6. 存证

| 错误代码                        | HTTP | 是否可重试 | 语义                                     |
| ------------------------------- | ---- | ---------- | ---------------------------------------- |
| `EVIDENCE_NOT_ELIGIBLE`         | 409  | 否         | 资源版本不满足存证条件                   |
| `EVIDENCE_ALREADY_CONFIRMED`    | 409  | 否         | 已存在最终证明                           |
| `EVIDENCE_SUBMISSION_UNKNOWN`   | 202  | 是         | 提交结果未知，系统将继续查询             |
| `EVIDENCE_BACKEND_UNAVAILABLE`  | 503  | 是         | 证明后端不可用                           |
| `EVIDENCE_RETRY_EXHAUSTED`      | 409  | 否         | 自动尝试已达上限                         |
| `VERIFICATION_RECORD_NOT_FOUND` | 404  | 否         | 未找到证明记录                           |
| `VERIFICATION_DIGEST_MISMATCH`  | 200  | 否         | 文件摘要不匹配，这是核验结果而非系统错误 |
| `CERTIFICATE_NOT_READY`         | 409  | 是         | 证书尚未生成                             |

## 7. 治理

| 错误代码                   | HTTP | 语义                   |
| -------------------------- | ---- | ---------------------- |
| `ADMIN_REASON_REQUIRED`    | 422  | 高风险动作缺少原因     |
| `ADMIN_ACTION_NOT_ALLOWED` | 403  | 当前角色不能执行该动作 |
| `TAXONOMY_IN_USE`          | 409  | 分类或标签仍被引用     |
| `AUDIT_RECORD_IMMUTABLE`   | 409  | 审计记录不可修改       |

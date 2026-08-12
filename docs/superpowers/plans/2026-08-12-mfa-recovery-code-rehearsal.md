# MFA 恢复码生产验收实施计划

> 本计划供当前会话中的 agentic worker 执行，按测试先行、证据优先的方式推进。

## Goal

把现有 MFA 恢复码实现从“核心逻辑已有”提升到“可被生产验收”：通过 HTTP 集成测试证明恢复码一次性消费、重新生成后旧码失效且新码可用；通过单元测试证明分布式锁拒绝时不会修改恢复码摘要；通过审计断言证明租户、资源和动作正确且不泄露 TOTP/恢复码；通过响应缓存策略阻止包含令牌或明文恢复码的响应被浏览器、代理或网关缓存；通过运维文档和脚本检查固化人工演练边界。

本计划不声称解决整个项目的生产发布阻塞。真实环境中的凭据、证书、密钥备份、存储恢复、容量基线和外部集成仍需由部署方完成。

## Architecture

- 继续使用现有 `AuthService` 的恢复码哈希存储、一次性消费和 `auth:mfa-recovery:{userId}` 分布式锁，不改变恢复码格式、哈希算法或 API 业务语义。
- 在 `AuthController` 的敏感响应端点声明 `ResponseCache(NoStore = true, Location = None)`，覆盖 MFA 验证、MFA 确认和恢复码重新生成响应。
- 单元测试通过结构化审计桩验证 `Action`、`TenantId`、`ResourceId` 和描述内容；审计桩永远不保存恢复码或 TOTP 明文。
- 集成测试使用隔离测试用户和测试租户，通过真实 HTTP、SQLite 测试数据库、真实 TOTP 计算和测试环境依赖替身验证跨层行为；不连接生产数据库、Redis 或真实消息基础设施。
- 运维演练仍需人工使用专用测试账号完成，自动化测试只提供回归证据，不消费生产恢复码。

## Tech Stack

- 后端：.NET 8、ASP.NET Core MVC、EF Core、SQLite 测试数据库、xUnit。
- 身份认证：现有 JWT、TOTP 服务和 `MfaRecoveryCodeService`。
- 测试辅助：`CustomWebApplicationFactory`、测试环境 Redis/锁替身、`OtpNet`。
- 验证命令：`dotnet test`、`dotnet build`、`bash tests/scripts/production-scripts-test.sh`、`git diff --check`。

## Global Constraints

- 先写能证明缺口的失败测试，再修改生产代码；每个红灯都要记录触发原因，不能用放宽断言或跳过测试消除红灯。
- 只使用 `apply_patch` 编辑文件；不修改 `docker/.env`、真实密钥、证书、数据库卷或部署环境。
- 新增注释、日志和文档使用简体中文；不在测试输出、审计桩、异常信息或报告中打印恢复码和 TOTP。
- 所有审计查询必须校验测试用户和租户，避免用跨租户查询掩盖隔离问题。
- 测试按顺序执行，避免并发构建造成程序集复制锁和误导性警告。
- 不改变公开恢复码 API 的 JSON 字段、HTTP 状态语义、密码学算法或生产数据迁移。

## File Mapping

| 文件 | 责任 |
| --- | --- |
| `tests/EquipAI.Tests.Unit/Web/AuthEndpointSecurityTests.cs` | 增加敏感 MFA 端点必须 `NoStore` 的失败/通过测试。 |
| `src/EquipAI.WebAPI/Controllers/AuthController.cs` | 为返回令牌或明文恢复码的 MFA 端点增加响应不可缓存声明。 |
| `tests/EquipAI.Tests.Unit/Services/AuthServiceTests.cs` | 扩展结构化审计桩和可控分布式锁桩；覆盖成功、失败、锁拒绝时的审计和摘要不变性。 |
| `tests/EquipAI.Tests.Integration/Controllers/AuthControllerTests.cs` | 增加完整 HTTP 恢复码登录、重复消费、重新生成、旧码失效、新码可用和响应头回归测试。 |
| `tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs` | 仅在现有测试替身不足以构造隔离 TOTP/锁场景时补充最小测试辅助，不引入生产配置分支。 |
| `docs/OPS_RUNBOOK.md` | 明确人工恢复码演练、缓存禁止、审计脱敏、专用账号和禁止使用生产码的验收步骤。 |
| `tests/scripts/production-scripts-test.sh` | 增加运维文档契约检查，防止恢复码演练安全边界被后续改文档时删除。 |
| `docs/superpowers/specs/2026-08-12-mfa-recovery-code-rehearsal-design.md` | 已提交的需求与验收设计，作为实现边界。 |

## Implementation Tasks

### 1. 建立响应缓存安全红灯

1. 在 `AuthEndpointSecurityTests` 中增加反射测试，逐一检查 `VerifyMfa`、`ConfirmMfaEnrollment`、`ConfirmMfa` 和 `RegenerateMfaRecoveryCodes` 方法的 `ResponseCacheAttribute`：`NoStore == true` 且 `Location == None`。
2. 先运行该测试并确认在当前代码上失败，证明生产端点确实没有缓存契约。
3. 在 `AuthController` 对应方法上增加属性，不改变业务逻辑。
4. 重跑该测试并增加/保留一个真实 HTTP 响应头断言，确认框架实际输出包含 `no-store`。

### 2. 补齐服务层安全回归测试

1. 让 `StubAuditLogService` 记录动作、租户、资源和描述的结构化快照，但明确不记录敏感参数。
2. 增加恢复码消费成功审计断言：动作是 `AuthMfaRecoveryCodeUsed`，租户和资源对应当前用户，描述不包含恢复码/TOTP。
3. 增加 TOTP 错误重新生成断言：记录 `MfaRecoveryCodesRegenerateFailed`，原恢复码摘要保持不变，描述不包含验证码。
4. 增加锁未获得断言：服务拒绝请求、数据库摘要不变，且不会产生成功审计或令牌。
5. 扩展锁桩为可针对恢复码资源返回未获得，确保不会误伤其他锁场景。

### 3. 补齐真实 HTTP 恢复码验收流

1. 用随机用户 ID、测试租户 ID、测试密码和固定测试 TOTP secret 构造隔离用户；通过现有 protector 加密 secret，通过现有恢复码服务生成哈希，避免手写生产格式。
2. `POST /api/v1/auth/login` 获取 MFA challenge；用恢复码调用 `/api/v1/auth/mfa/verify`，断言返回令牌、响应不可缓存和审计记录。
3. 再次登录并重复使用同一个恢复码，断言返回 401；不能因为重试而重新签发令牌。
4. 用第一次登录得到的 Bearer 令牌和当前 TOTP 调用 `/api/v1/auth/mfa/recovery-codes/regenerate`，断言返回 8 个新码、响应不可缓存。
5. 使用重新生成前未消费的旧码登录并断言失败；使用新码登录并断言成功。
6. 查询测试租户的审计记录，断言包含使用/重新生成动作，租户与资源正确，任一恢复码和 TOTP 都未出现在描述或序列化内容中。
7. 在 `finally` 中清理测试用户和审计数据，避免共享 SQLite 测试库污染其他测试。

### 4. 固化人工演练与脚本契约

1. 在 `OPS_RUNBOOK.md` 的恢复码演练中补充：验证响应 `Cache-Control: no-store`；不把响应体、恢复码或 TOTP 写入代理、浏览器缓存、日志、截图和工单；只能使用专用测试账号。
2. 补充锁竞争/旧码失效/新码可用/审计无敏感值的验收记录项，并把自动化测试和现场演练的边界写清楚。
3. 在 `production-scripts-test.sh` 增加文档契约检查，校验关键安全短语和禁止项存在；先让新增检查在文档缺少内容时红灯，再更新文档转绿。

### 5. 分层验证与审查

依次执行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AuthServiceTests|FullyQualifiedName~AuthEndpointSecurityTests|FullyQualifiedName~MfaRecoveryCodeServiceTests"
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~AuthControllerTests"
dotnet build src/EquipAI.WebAPI/EquipAI.WebAPI.csproj --no-restore -m:1
bash tests/scripts/production-scripts-test.sh setup
bash tests/scripts/production-scripts-test.sh all
git diff --check
```

若聚焦测试通过，再运行后端完整单元/集成测试；若改动未触及前端，保留已有前端基线，不以未运行前端测试冒充全仓库验证。最终检查 `git status`、测试输出和当前真实环境 27 项阻塞项，向用户明确区分代码证据与部署方待办。

## Definition of Done

- 敏感 MFA 响应端点有 `NoStore` 声明且 HTTP 回归测试通过。
- 一次性消费、锁拒绝安全、重新生成旧码失效/新码可用均有自动化证据。
- 审计动作、租户、资源正确，描述及测试报告不含恢复码/TOTP 明文。
- 运维剧本和生产脚本契约都明确人工演练边界。
- 相关测试、构建、生产脚本和差异检查通过；失败项有明确原因和后续动作。
- 不修改真实凭据、证书、生产数据库或部署环境，不把局部完成误报为项目整体生产就绪。

# 告警邮件可靠投递实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户开启 `alert.email` 后，告警邮件通过可持久化、可重试、可观测的 SMTP 投递队列可靠送达，同时保持工单/系统邮件明确不可用。

**Architecture:** 告警通知事务同时写入现有 `notifications` 和新的 `email_notification_deliveries` 表；独立 `EmailNotificationDispatcher` 使用数据库租约领取任务并调用返回结果的 SMTP 服务。邮件失败只影响邮件队列，不阻塞告警事件、站内通知或机器人通知。

**Tech Stack:** .NET 8、EF Core 8、PostgreSQL/SQLite/InMemory、xUnit、Moq、ASP.NET hosted service、React 19、TypeScript、Vitest、i18n、Prometheus。

## Global Constraints

- 所有新增字段、方法、日志和文档说明使用中文；日志不得输出邮箱地址、邮件正文或 SMTP 凭据。
- 所有后台查询显式携带 `tenant_id`，不能依赖 HTTP 请求上下文；租约更新必须带 `lock_token` 条件。
- `alert.email` 可用；`workorder.email` 和 `system.email` 必须保持 `false`，界面要说明原因。
- SMTP 未配置时 worker 不领取任务、不消耗重试次数；宿主取消必须继续传播。
- 不修改真实 `docker/.env`，不添加第三方邮件 SDK，不把 SMTP 调用放进告警事件同步路径。
- 每个任务完成独立测试后再进入下一任务；实现结束必须运行后端、前端和生产脚本完整门禁。

---

### Task 1: 建立邮件投递状态模型与 EF 配置

**Files:**
- Create: `src/EquipAI.Core/Enums/EmailDeliveryStatus.cs`
- Create: `src/EquipAI.Core/Entities/EmailNotificationDelivery.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/EmailNotificationDeliveryConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/EmailNotificationDeliveryModelTests.cs`

**Interfaces:**
- Produces `EmailDeliveryStatus`（`Pending`、`Sent`、`Cancelled`、`DeadLetter`）和 `EmailNotificationDelivery`。
- `EmailNotificationDelivery` 至少提供 `TenantId`、`UserId`、`NotificationId`、`Status`、`AttemptCount`、`AvailableAt`、`LockedUntil`、`LockToken`、`SentAt`、`LastError`、`CreatedAt`。

- [ ] **Step 1: Write the failing model/configuration test**

  测试使用 InMemory `AppDbContext`，验证实体可保存、默认状态为 `Pending`，并验证 `NotificationId` 唯一索引通过模型元数据暴露；验证 `LastError` 最大长度为 2000。

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDeliveryModelTests" -v:q`

  Expected: FAIL because the entity and EF configuration do not yet exist.

- [ ] **Step 3: Implement the model and configuration**

  `EmailNotificationDeliveryConfiguration` 映射到 `email_notification_deliveries`，为 `notification_id` 建唯一索引，为 `(status, available_at, locked_until, created_at)` 建领取索引，为 `(tenant_id, created_at)` 建运维索引；不建立邮箱明文字段。

- [ ] **Step 4: Run the focused test to verify it passes**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDeliveryModelTests" -v:q`

  Expected: PASS.

- [ ] **Step 5: Commit the model boundary**

  ```bash
  git add src/EquipAI.Core/Enums/EmailDeliveryStatus.cs src/EquipAI.Core/Entities/EmailNotificationDelivery.cs src/EquipAI.Infrastructure/Data/Configurations/EmailNotificationDeliveryConfiguration.cs src/EquipAI.Infrastructure/Data/AppDbContext.cs tests/EquipAI.Tests.Unit/Notifications/EmailNotificationDeliveryModelTests.cs
  git commit -m "feat(notification): add email delivery persistence model"
  ```

### Task 2: 改造 SMTP 服务并增加邮件正文渲染器

**Files:**
- Modify: `src/EquipAI.Application/Notifications/SmtpEmailNotificationService.cs`
- Create: `src/EquipAI.Application/Notifications/ISmtpMailSender.cs`
- Create: `src/EquipAI.Application/Notifications/SmtpMailSender.cs`
- Create: `src/EquipAI.Application/Notifications/AlertEmailTemplateRenderer.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/SmtpEmailNotificationServiceTests.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/AlertEmailTemplateRendererTests.cs`

**Interfaces:**
- `SmtpEmailNotificationService.IsConfigured`：只读配置状态。
- `ISmtpMailSender.SendAsync(MailMessage message, CancellationToken ct)`：隔离 `System.Net.Mail.SmtpClient`，让服务层测试不访问真实网络。
- `Task<bool> SmtpEmailNotificationService.SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)`：`true` 表示 SMTP 已接受发送，普通失败返回 `false`，已取消的令牌继续抛出。
- `AlertEmailTemplateRenderer.Render(Notification notification, string? language)`：返回 HTML 正文。

- [ ] **Step 1: Write failing tests**

  覆盖 SMTP 未配置返回 `false`、成功发送返回 `true`、无效邮箱不发送并返回 `false`、普通异常返回 `false`、取消传播；模板测试使用包含 `<script>` 和 HTML 属性的标题/内容，断言输出已编码且包含站内链接。

- [ ] **Step 2: Run focused tests and verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~SmtpEmailNotificationServiceTests|FullyQualifiedName~AlertEmailTemplateRendererTests" -v:q`

  Expected: FAIL because `SendAsync` 仍返回 `Task` 且没有可复用模板渲染器。

- [ ] **Step 3: Implement result-aware SMTP sending**

  保留密码重置调用方兼容性（调用方可以忽略 `bool`）；捕获 `OperationCanceledException` 时仅在 `ct.IsCancellationRequested` 为真时重新抛出，其他异常记录任务上下文后返回 `false`。发送前用 `MailAddress` 校验地址，日志只写任务/用户标识，不写邮箱。

- [ ] **Step 4: Implement HTML-safe alert template**

  使用 `WebUtility.HtmlEncode` 编码标题、内容、设备字段和指标字段；站内链接只允许应用内部相对路径或经过配置的前端基地址，禁止把用户输入拼接成任意脚本。

- [ ] **Step 5: Run focused tests to verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~SmtpEmailNotificationServiceTests|FullyQualifiedName~AlertEmailTemplateRendererTests" -v:q`

  Expected: PASS.

### Task 3: 实现租约存储与可重试邮件 dispatcher

**Files:**
- Create: `src/EquipAI.Infrastructure/Messaging/EmailDeliveryOptions.cs`
- Create: `src/EquipAI.Infrastructure/Messaging/EmailNotificationDeliveryStore.cs`
- Create: `src/EquipAI.Application/Notifications/EmailNotificationDispatcher.cs`
- Modify: `src/EquipAI.Infrastructure/Metrics/BusinessMetrics.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/EmailNotificationDeliveryStoreTests.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/EmailNotificationDispatcherTests.cs`

**Interfaces:**
- `EmailDeliveryOptions`：`Enabled`、`PollIntervalSeconds`、`BatchSize`、`LeaseSeconds`、`MaxAttempts`、`MaxBackoffSeconds`、`RetentionDays`。
- `EmailNotificationDeliveryStore.TryClaimAsync`、`MarkSentAsync`、`MarkCancelledAsync`、`MarkFailedAsync`，所有更新必须带任务 ID 和租约 token。
- `EmailNotificationDispatcher.DispatchBatchAsync(CancellationToken)`：内部可测试的一轮处理。

- [ ] **Step 1: Write failing lease/store tests**

  覆盖两个竞争者只有一个能领取、旧 token 不能标记成功/失败、成功清除锁和错误、达到最大次数变为 `DeadLetter`、错误信息截断为 2000 字符。

- [ ] **Step 2: Run focused store tests and verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDeliveryStoreTests" -v:q`

  Expected: FAIL because store and status transitions do not exist.

- [ ] **Step 3: Implement atomic lease store**

  参照 `OutboxMessageStore` 使用 `ExecuteUpdateAsync`；领取条件为 `Status=Pending`、`AvailableAt<=now` 且锁为空或已过期；更新条件始终包含 `LockToken`。

- [ ] **Step 4: Run store tests and verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDeliveryStoreTests" -v:q`

  Expected: PASS.

- [ ] **Step 5: Write failing dispatcher tests**

  用可替换的 SMTP mock 和 InMemory 数据库覆盖：SMTP 未配置不领取；成功发送标记 `Sent`；普通失败退避；达到上限标记 `DeadLetter`；用户停用/关闭偏好标记 `Cancelled`；宿主取消继续抛出；已发送任务不再发送。

- [ ] **Step 6: Run dispatcher tests and verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDispatcherTests" -v:q`

  Expected: FAIL because dispatcher is not registered or implemented.

- [ ] **Step 7: Implement dispatcher and metrics**

  Worker 未配置 SMTP 时只记录受控警告并等待，不领取任务；正常循环按 `PollIntervalSeconds` 休眠。每轮更新 pending gauge，并递增 sent/failure/dead-letter counters；清理已结束且超过 `RetentionDays` 的任务，每轮最多 1000 条。

- [ ] **Step 8: Run dispatcher tests and verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~EmailNotificationDispatcherTests" -v:q`

  Expected: PASS.

### Task 4: 将告警事务接入邮件队列并注册运行时配置

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertNotificationService.cs`
- Modify: `src/EquipAI.Application/Notifications/NotificationPreferenceService.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Modify: `src/EquipAI.WebAPI/appsettings.json`
- Modify: `src/EquipAI.WebAPI/appsettings.Production.json`
- Modify: `tests/EquipAI.Tests.Unit/Notifications/NotificationPreferenceServiceTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Alerts/AlertNotificationServiceTests.cs`

**Interfaces:**
- `NotificationPreferenceService.Normalize` 保留 `Alert.Email`，并将 `WorkOrder.Email`、`System.Email` 固定为 `false`。
- `AlertNotificationService` 在同一次 `SaveChangesAsync` 中创建 `Notification` 与符合偏好的 `EmailNotificationDelivery`。

- [ ] **Step 1: Extend failing preference tests**

  将原“邮件始终关闭”测试改为：告警邮件显式开启后可读取、活动用户筛选可返回；工单/系统邮件仍被规范化为关闭；损坏 JSON 回退为默认关闭。

- [ ] **Step 2: Run preference tests to verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~NotificationPreferenceServiceTests" -v:q`

  Expected: FAIL because当前实现会关闭 `Alert.Email`。

- [ ] **Step 3: Implement preference normalization**

  复制 `Alert.Email`，只对 `WorkOrder` 和 `System` 调用 `Email=false`；未知通知类型仍按系统偏好处理。

- [ ] **Step 4: Run preference tests to verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~NotificationPreferenceServiceTests" -v:q`

  Expected: PASS.

- [ ] **Step 5: Extend failing alert notification tests**

  为活动技术员/主管创建 `alert.email=true` 和无邮件偏好的用户，断言只有符合偏好的用户生成邮件任务；断言每个 `NotificationId` 只有一条任务，停用用户、其他租户和无邮箱用户不生成任务。

- [ ] **Step 6: Run alert tests to verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~AlertNotificationServiceTests" -v:q`

  Expected: FAIL because alert dispatch currently only creates in-app notifications.

- [ ] **Step 7: Implement atomic enqueue and runtime registration**

  在 `PersistInAppNotificationAsync` 作用域中解析 `NotificationPreferenceService`，先读取候选用户及告警邮件偏好，再创建通知和任务对象后一次保存；注册 `EmailNotificationDeliveryStore`、`EmailNotificationDispatcher` 和 `EmailDelivery` options，Production 默认启用 worker 但不绕过 SMTP 配置门禁。

- [ ] **Step 8: Run alert tests and verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~AlertNotificationServiceTests|FullyQualifiedName~NotificationPreferenceServiceTests" -v:q`

  Expected: PASS.

### Task 5: 添加数据库迁移与集成验证

**Files:**
- Create: `src/EquipAI.Infrastructure/Data/Migrations/20260813140000_AddEmailNotificationDeliveries.cs`
- Create: `src/EquipAI.Infrastructure/Data/Migrations/20260813140000_AddEmailNotificationDeliveries.Designer.cs`
- Modify: `src/EquipAI.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs`
- Test: `tests/EquipAI.Tests.Integration/Controllers/NotificationsControllerTests.cs`
- Test: `tests/EquipAI.Tests.Integration/Alerts/AlertNotificationIntegrationTests.cs`

**Interfaces:**
- 迁移创建 `email_notification_deliveries` 表、约束和索引，不改动既有通知表数据。

- [ ] **Step 1: Write failing integration assertions**

  覆盖关系型数据库迁移后可写入/读取任务，以及一次告警触发后通知和邮件任务在同一数据上下文可见；跨租户用户不能读到其他租户任务。

- [ ] **Step 2: Run integration assertions to verify failure**

  Run: `dotnet test tests/EquipAI.Tests.Integration --no-restore --filter "FullyQualifiedName~AlertNotificationIntegrationTests|FullyQualifiedName~NotificationsControllerTests" -v:q`

  Expected: FAIL until schema and wiring are present.

- [ ] **Step 3: Generate and inspect the EF migration**

  Run: `dotnet ef migrations add AddEmailNotificationDeliveries --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI --no-build`

  Inspect that only the new table, indexes and model snapshot changes are present; reject any accidental destructive operation.

- [ ] **Step 4: Run focused integration tests to verify pass**

  Run: `dotnet test tests/EquipAI.Tests.Integration --no-restore --filter "FullyQualifiedName~AlertNotificationIntegrationTests|FullyQualifiedName~NotificationsControllerTests" -v:q`

  Expected: PASS.

### Task 6: 更新前端邮件偏好和双语资源

**Files:**
- Modify: `frontend/src/components/settings/NotificationPreferenceCard.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`
- Modify: `frontend/src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx`
- Modify: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- 仅 `alert` 行的邮件开关可操作；`workorder`、`system` 邮件开关禁用并通过 `aria-describedby` 说明暂未支持。
- “全部”开关在告警行包含邮件，在其他行只包含已实现的 SignalR/Push。

- [ ] **Step 1: Extend the frontend test with failing assertions**

  断言告警邮件开关可用、工单/系统邮件开关禁用，禁用原因可通过辅助文本读取；断言切换告警邮件会提交 `email` 状态，切换其他行不会伪造邮件开启。

- [ ] **Step 2: Run the focused Vitest test to verify failure**

  Run: `cd frontend && npm run test -- src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx --run`

  Expected: FAIL because当前所有邮件开关都禁用。

- [ ] **Step 3: Implement type-specific availability and Chinese/English copy**

  将邮件渠道改为按通知类型判断；更新邮件描述为“告警邮件需配置 SMTP”，并明确工单/系统邮件暂未开放；保留已有双语键覆盖检查。

- [ ] **Step 4: Run focused frontend tests**

  Run: `cd frontend && npm run test -- src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx --run`

  Expected: PASS.

- [ ] **Step 5: Add production contract assertions**

  在 `production-scripts-test.sh` 断言 SMTP 配置、`EmailDelivery` options、worker 注册、队列表和前端类型特定邮件开关契约存在，防止模板/注册遗漏。

### Task 7: 完成全量验证、文档和交付审查

**Files:**
- Modify: `docs/DEPLOY.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/S09-风险登记册.md`

- [ ] **Step 1: Run backend and frontend focused gates**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore -v:q
  dotnet test tests/EquipAI.Tests.Integration --no-restore -v:q
  cd frontend && npx tsc -p tsconfig.json --noEmit
  npm run lint
  npm run check:i18n
  npm run test -- --run
  npm run build
  ```

- [ ] **Step 2: Run release and production script gates**

  ```bash
  dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false -v:q
  bash -n docker/*.sh tests/scripts/*.sh
  bash tests/scripts/production-scripts-test.sh all
  git diff --check
  ```

- [ ] **Step 3: Update evidence without overstating deployment readiness**

  记录邮件队列测试数量、SMTP 未配置时的安全行为、迁移和指标；明确真实 SMTP 凭据、证书、Docker E2E 与现场验收仍需部署侧完成。

- [ ] **Step 4: Perform plan self-review**

  检查所有计划文件路径、状态枚举、方法签名、配置键和测试过滤器一致；搜索 `TBD`、`TODO`、英文日志和未实现的邮件开关。

- [ ] **Step 5: Commit the implementation when repository approval is available**

  ```bash
  git add src tests frontend docs
  git commit -m "feat(notification): add reliable alert email delivery"
  ```

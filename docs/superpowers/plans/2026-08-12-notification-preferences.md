# 通知偏好真正生效实施计划

> **For agentic workers:** 本计划在当前工作区内联执行；每个任务都必须先写失败测试并观察 RED，再实现最小代码并复跑回归。遵循仓库 AGENTS.md 的中文注释/日志规范，不擅自提交或暂存。

**Goal:** 让用户设置的 SignalR 和 Web Push 通知偏好真正控制对应渠道，同时保留站内历史、租户隔离和安全默认值。

**Architecture:** `NotificationPreferenceService` 统一解析并筛选活动用户；`IndustrialHub` 为每个连接加入租户组和租户内用户组；`SignalRNotificationService` 按通知类型选择定向用户组和 Push 收件人；遥测/页面刷新继续使用租户广播。Email 目前没有告警投递链，API 与前端均明确保持不可用。

**Tech Stack:** .NET 8、ASP.NET Core SignalR、EF Core、SQLite/InMemory 单测、xUnit/FluentAssertions/Moq、React 19、TypeScript、Vitest、Testing Library、TanStack Query、i18n。

## Global Constraints

- 所有业务查询显式携带 `tenant_id`，后台任务使用 `IgnoreQueryFilters` + 显式租户条件。
- 活动用户才是通知收件人；不得创建 `UserId=Guid.Empty` 通知。
- 空/损坏偏好按 SignalR/Push 开启、Email 关闭处理。
- 普通 SignalR/Push 故障隔离；宿主或调用方取消继续传播。
- 代码注释、日志、文档使用简体中文；前端新增文案同步中英文。
- 不新增数据库表或迁移，不提交/暂存工作区已有改动。

---

### Task 1: 统一偏好解析和用户筛选

**Files:**
- Modify: `src/EquipAI.Application/Notifications/NotificationPreferenceService.cs`
- Test: `tests/EquipAI.Tests.Unit/Notifications/NotificationPreferenceServiceTests.cs`（新建）

**Interfaces:**
- Produces `Task<IReadOnlySet<Guid>> GetEnabledUserIdsAsync(Guid tenantId, IReadOnlyCollection<Guid> candidateUserIds, string notificationType, string channel, CancellationToken ct = default)`。
- `UpdateAsync` 持久化前将 Email 全部规范化为 `false`；`GetAsync` 对历史 `email=true` 同样返回不可用状态。

- [ ] **Step 1: 写失败测试**
  - 覆盖 `{}` 默认开启 SignalR/Push、Email 关闭。
  - 覆盖显式关闭 `alert.signalr` 或 `workorder.push` 后只返回允许用户。
  - 覆盖停用用户、其他租户和 `Guid.Empty` 候选被排除。
  - 覆盖损坏 JSON 回退默认值。
  - 覆盖 `UpdateAsync` 把 Email 规范化为 false。

- [ ] **Step 2: 运行测试确认 RED**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~NotificationPreferenceServiceTests"
```

预期：新筛选 API 尚不存在，编译失败或行为断言失败；不得因测试拼写错误失败。

- [ ] **Step 3: 实现最小代码**
  - 抽取安全默认值和 JSON 解析方法，保持 `GetByType` 的现有通知类型兼容。
  - 用 `_db.UnfilteredSet<User>()` 查询 `tenantId`、`IsActive` 和候选 ID，再在内存中按偏好筛选，空候选直接返回空集合。
  - `GetAsync`/`UpdateAsync` 返回规范化对象，未知渠道继续默认开启以保持已有兼容行为；Email 固定 false。

- [ ] **Step 4: 运行测试确认 GREEN**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~NotificationPreferenceServiceTests"
```

预期：全部通过。

### Task 2: 增加租户内用户 SignalR 组

**Files:**
- Modify: `src/EquipAI.WebAPI/Hubs/IndustrialHub.cs`
- Test: `tests/EquipAI.Tests.Unit/Hubs/IndustrialHubTests.cs`（沿用并扩展现有测试）

**Interfaces:**
- Produces group name `tenant:{tenantId}:user:{userId}`。
- `OnConnectedAsync` 加入租户组和用户组；`OnDisconnectedAsync` 移除两者。

- [ ] **Step 1: 写失败测试**
  - 使用测试租户上下文和连接 ID 验证连接时两次调用 `AddToGroupAsync`，断开时两次调用 `RemoveFromGroupAsync`。
  - 覆盖 `Guid.Empty` 租户/用户不加入非法组。

- [ ] **Step 2: 运行 Hub 测试确认 RED**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~IndustrialHubTests"
```

预期：用户组断言失败。

- [ ] **Step 3: 实现最小代码**
  - 使用 `_tenantContext.UserId` 生成租户限定的用户组。
  - 将 `Context.ConnectionAborted` 传给组操作，停机/断连时不继续等待无界任务。

- [ ] **Step 4: 运行测试确认 GREEN**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~IndustrialHubTests"
```

预期：全部通过。

### Task 3: 扩展 Web Push 批量定向接口

**Files:**
- Modify: `src/EquipAI.Core/Interfaces/IPushNotificationService.cs`
- Modify: `src/EquipAI.Application/Notifications/PushNotificationService.cs`
- Modify: `tests/EquipAI.Tests.Unit/Notifications/PushNotificationServiceTests.cs`

**Interfaces:**
- Produces `Task SendToUsersAsync(Guid tenantId, IReadOnlyCollection<Guid> userIds, string title, string body, string? url = null, CancellationToken ct = default)`。

- [ ] **Step 1: 写失败测试**
  - 验证空用户集合不查库、不发送。
  - 验证批量方法只查询指定租户、指定用户且 `IsActive` 的订阅。
  - 在没有 VAPID 配置时验证安全降级，不抛异常。

- [ ] **Step 2: 运行 Push 测试确认 RED**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~PushNotificationServiceTests"
```

预期：新接口/行为断言失败。

- [ ] **Step 3: 实现最小代码**
  - 批量一次查询订阅，复用现有载荷发送和 410 清理逻辑。
  - 循环发送前检查 `ct.ThrowIfCancellationRequested()`；普通单订阅异常继续处理其他订阅。

- [ ] **Step 4: 运行 Push 测试确认 GREEN**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~PushNotificationServiceTests"
```

预期：全部通过。

### Task 4: 将通知分发接入偏好和定向组

**Files:**
- Modify: `src/EquipAI.WebAPI/Services/SignalRNotificationService.cs`
- Modify: `tests/EquipAI.Tests.Unit/Notifications/SignalRNotificationServiceTests.cs`
- `src/EquipAI.Core/Interfaces/ISignalRNotificationService.cs` 保持现有取消令牌契约，无需改动

**Interfaces:**
- `SendAlertTriggeredAsync`、告警确认/解除、工单升级、设备/网关离线使用定向用户组。
- `SendWorkOrderCreatedAsync`、状态变更、分析更新和候选规则使用活动用户定向组；遥测继续使用 `tenant:{tenantId}` 广播。

- [ ] **Step 1: 写失败测试**
  - 为一个同租户用户关闭 alert.signalr，另一个用户保持开启；验证告警 SignalR 只调用开启用户组。
  - 为工单 Push 构造开启/关闭用户，验证 Push 只收到开启用户 ID 集合。
  - 验证无允许用户时不调用 `Groups`/批量 Push，但站内持久化仍完成。
  - 验证 SignalR 普通异常仍不影响持久化/Push，取消仍传播。

- [ ] **Step 2: 运行通知服务测试确认 RED**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~SignalRNotificationServiceTests"
```

预期：当前服务仍使用租户广播/Push 广播，偏好过滤断言失败。

- [ ] **Step 3: 实现最小代码**
  - 注入 `NotificationPreferenceService`。
  - 添加活动用户候选查询、偏好过滤和 `tenant:{tenantId}:user:{userId}` 组名辅助方法。
  - 将 SignalR 和 Push 两个通道分别包在故障隔离块中；偏好查询普通异常按空收件人降级，取消继续传播。
  - 保留 `AlertNotificationService`/`AddUserNotificationsAsync` 的站内历史写入，不读取渠道偏好。

- [ ] **Step 4: 运行通知服务测试确认 GREEN**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1 --filter "FullyQualifiedName~SignalRNotificationServiceTests"
```

预期：全部通过。

### Task 5: 让设置页诚实表达 Email 通道不可用

**Files:**
- Modify: `frontend/src/components/settings/NotificationPreferenceCard.tsx`
- Modify: `frontend/src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**
- Email Switch 始终禁用，保留当前值为 false；“全部”开关只计算 SignalR + Push。
- 新增中英文 `emailUnavailable` 文案并通过 `aria-describedby` 关联。

- [ ] **Step 1: 写失败测试**
  - 用现有英文测试增加断言：Email switch `aria-disabled=true`、不可触发更新；“全部”不会把 Email 设为 true。
  - 增加不可用说明的中英文键覆盖断言。

- [ ] **Step 2: 运行前端组件测试确认 RED**

```bash
cd frontend && npm run test -- src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx
```

预期：Email 当前可点击、整行操作会写入 true，测试失败。

- [ ] **Step 3: 实现最小代码**
  - 给 channels 增加 `available` 标志；Email 关闭交互但保留表格可见性。
  - `toggleChannel`/`toggleRow` 忽略 Email，更新时显式写 `email:false`。
  - 同步中英文文案和 `aria-describedby`。

- [ ] **Step 4: 运行前端测试与静态门禁**

```bash
cd frontend && npm run test -- src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx && npx tsc -p tsconfig.json --noEmit && npm run lint && npm run check:i18n
```

预期：全部通过，src 内 0 error 且 warning 不超过 1。

### Task 6: 补充 API 多用户/多租户回归

**Files:**
- Modify: `tests/EquipAI.Tests.Integration/Controllers/NotificationsControllerTests.cs`

**Interfaces:**
- 通过真实 WebApplicationFactory HTTP 请求验证当前用户只能看到自己的通知；直接写入测试数据库的标记数据必须使用显式租户和用户 ID。

- [ ] **Step 1: 写失败测试**
  - 同租户 admin/lead 各写一条唯一标记通知，admin API 只能返回 admin 标记。
  - 写入 tenant2 标记通知，admin API 不能返回跨租户标记。

- [ ] **Step 2: 运行集成测试确认 RED/GREEN**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Integration --no-restore -m:1 --filter "FullyQualifiedName~NotificationsControllerTests"
```

预期：当前通知查询按 UserId/全局租户过滤已应通过；若测试暴露共享夹具污染，先修复测试隔离再继续。

- [ ] **Step 3: 保持生产查询契约**
  - 不为测试放宽控制器权限，不添加客户端可传的 UserId/TenantId 查询参数。
  - 复跑该类全部测试并记录结果。

### Task 7: 全量验证与文档同步

**Files:**
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`

- [ ] **Step 1: 运行全量后端验证**

```bash
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Unit --no-restore -m:1
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet test tests/EquipAI.Tests.Integration --no-restore -m:1
DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1 dotnet build EquipAI.sln --configuration Release --no-restore -m:1
```

- [ ] **Step 2: 运行前端、脚本和镜像验证**

```bash
cd frontend && npm run test && npx tsc -p tsconfig.json --noEmit && npm run lint && npm run check:i18n && npm run build
cd .. && bash tests/scripts/production-scripts-test.sh all
docker build --file docker/Dockerfile.backend --tag equipsense/backend:ci-smoke .
SMOKE_RUN_E2E=true SMOKE_E2E_WORKERS=2 bash tests/scripts/production-runtime-smoke.sh
```

- [ ] **Step 3: 更新当前测试计数和通知偏好风险说明**
  - 只更新当前状态和新版本日志，保留历史版本计数。
  - 明确 Email 告警未实现，避免把“设置已保存”误写成“邮件已发送”。

- [ ] **Step 4: 最终检查**

```bash
git -c core.fsmonitor=false diff --check
git -c core.fsmonitor=false status --short
```

预期：无 diff 空白错误；不暂存、不提交；最终报告列出验证证据和仍需真实凭据/证书的上线门禁。
